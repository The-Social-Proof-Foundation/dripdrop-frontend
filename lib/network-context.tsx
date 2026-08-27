'use client'

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from 'react'
import { flushSync } from 'react-dom'
import Cookies from 'js-cookie'
import { resetMySoGraphQLClient } from '@/lib/myso-graphql-client'
import type { NetworkType } from '@/lib/network-utils'
import { toast } from 'sonner'

interface NetworkContextType {
  currentNetwork: NetworkType
  changeNetwork: (network: NetworkType) => void
  isChangingNetwork: boolean
  isNetworkHydrated: boolean
}

const NetworkContext = createContext<NetworkContextType>({
  currentNetwork: 'testnet',
  changeNetwork: () => {},
  isChangingNetwork: false,
  isNetworkHydrated: false,
})

export const useNetwork = () => useContext(NetworkContext)

interface NetworkProviderProps {
  children: ReactNode
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkType>('testnet')
  const [isChangingNetwork, setIsChangingNetwork] = useState(false)
  const [isNetworkHydrated, setIsNetworkHydrated] = useState(false)

  useEffect(() => {
    const savedNetwork = Cookies.get('selectedNetwork')
    if (savedNetwork === 'mainnet' || savedNetwork === 'testnet' || savedNetwork === 'localnet') {
      setCurrentNetwork(savedNetwork)
    } else {
      Cookies.set('selectedNetwork', 'testnet', { expires: 365 })
    }
    setIsNetworkHydrated(true)
  }, [])

  const changeNetwork = useCallback(
    async (network: NetworkType) => {
      if (isChangingNetwork || network === currentNetwork) return

      setIsChangingNetwork(true)

      try {
        flushSync(() => {
          Cookies.set('selectedNetwork', network, { expires: 365 })
          resetMySoGraphQLClient()
          setCurrentNetwork(network)
        })

        const networkNames = {
          mainnet: 'Mainnet',
          testnet: 'Testnet',
          localnet: 'Localnet',
        }

        toast.success(`Network changed to ${networkNames[network]}`)
      } catch (error) {
        console.error('Error changing network:', error)
        toast.error('Failed to change network')
      } finally {
        queueMicrotask(() => setIsChangingNetwork(false))
      }
    },
    [currentNetwork, isChangingNetwork],
  )

  const contextValue = useMemo(
    () => ({ currentNetwork, changeNetwork, isChangingNetwork, isNetworkHydrated }),
    [currentNetwork, changeNetwork, isChangingNetwork, isNetworkHydrated],
  )

  return <NetworkContext.Provider value={contextValue}>{children}</NetworkContext.Provider>
}

export type { NetworkType }
