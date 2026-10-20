const DB_NAME = 'mysocial-zklogin-session'
const STORE = 'session'
const DEVICE_KEY_ID = 'device-key-raw'
const SIGNER_ID = 'signer'

export type ZkLoginRestoreRecord = {
  address: string
  addressSeed: string
  maxEpoch: number
  proofPoints: { a: string[]; b: string[][]; c: string[] }
  issBase64Details: { value: string; indexMod4: number }
  headerBase64: string
  proofVersion?: number
  sub?: string
  /** Prover network, issuer and client the proof was built for; a proof is only reusable for the same triple. */
  network?: string
  iss?: string
  aud?: string
}

type StoredRecord = ZkLoginRestoreRecord & {
  iv: number[]
  cipher: number[]
}

/** Raw AES key bytes — structured-clone of CryptoKey is unreliable across Safari reloads. */
type StoredDeviceKey = { k: number[] }

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function idbGet<T>(key: string): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
        request.onsuccess = () => resolve(request.result as T | undefined)
        request.onerror = () => reject(request.error)
      }),
  )
}

function idbSet(key: string, value: unknown): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).put(value, key)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      }),
  )
}

function idbDelete(key: string): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).delete(key)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      }),
  )
}

async function wrappingKey(): Promise<CryptoKey> {
  const existingRaw = await idbGet<StoredDeviceKey>(DEVICE_KEY_ID)
  if (existingRaw?.k?.length === 32) {
    return crypto.subtle.importKey(
      'raw',
      new Uint8Array(existingRaw.k),
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt'],
    )
  }

  // Migrate legacy non-extractable CryptoKey rows when possible.
  const legacy = await idbGet<CryptoKey>('device-key')
  if (legacy) {
    try {
      const raw = new Uint8Array(await crypto.subtle.exportKey('raw', legacy))
      await idbSet(DEVICE_KEY_ID, { k: Array.from(raw) } satisfies StoredDeviceKey)
      await idbDelete('device-key')
      return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
    } catch {
      // Non-extractable legacy key — keep using it for this session only.
      return legacy
    }
  }

  const created = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ])
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', created))
  await idbSet(DEVICE_KEY_ID, { k: Array.from(raw) } satisfies StoredDeviceKey)
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

let loadedSigner: { secret: string; record: ZkLoginRestoreRecord } | null | undefined
let loadedSignerPending: Promise<{ secret: string; record: ZkLoginRestoreRecord } | null> | null = null

export async function saveZkLoginSigner(secret: string, record: ZkLoginRestoreRecord): Promise<void> {
  const key = await wrappingKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plain = new TextEncoder().encode(secret)
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      plain.buffer.slice(plain.byteOffset, plain.byteOffset + plain.byteLength) as ArrayBuffer,
    ),
  )
  const stored: StoredRecord = { ...record, iv: Array.from(iv), cipher: Array.from(cipher) }
  await idbSet(SIGNER_ID, stored)
  loadedSigner = { secret, record }
}

export async function loadZkLoginSigner(): Promise<{ secret: string; record: ZkLoginRestoreRecord } | null> {
  if (loadedSigner !== undefined) return loadedSigner
  if (loadedSignerPending) return loadedSignerPending
  loadedSignerPending = (async () => {
    const stored = await idbGet<StoredRecord>(SIGNER_ID)
    if (!stored) {
      loadedSigner = null
      return null
    }
    try {
      const key = await wrappingKey()
      const plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(stored.iv) },
        key,
        new Uint8Array(stored.cipher),
      )
      const { iv: _iv, cipher: _cipher, ...record } = stored
      loadedSigner = { secret: new TextDecoder().decode(plain), record }
      return loadedSigner
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[zkLogin] could not decrypt stored proof', err)
      }
      loadedSigner = null
      return null
    } finally {
      loadedSignerPending = null
    }
  })()
  return loadedSignerPending
}

export async function clearZkLoginSigner(): Promise<void> {
  loadedSigner = undefined
  loadedSignerPending = null
  await idbDelete(SIGNER_ID)
}
