const DEFAULT_MAX_VIDEO_DURATION_SECONDS = 12

export function getMaxVideoDurationSeconds(): number {
  const raw = process.env.NEXT_PUBLIC_MAX_VIDEO_DURATION_SECONDS
  if (!raw) return DEFAULT_MAX_VIDEO_DURATION_SECONDS

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MAX_VIDEO_DURATION_SECONDS
  }

  return parsed
}

/** e.g. "12-second" */
export function getVideoDurationLabel(): string {
  return `${getMaxVideoDurationSeconds()}-second`
}
