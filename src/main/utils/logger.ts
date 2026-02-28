// 자동화 과정 디버깅을 위한 간단한 로거
const LOG_PREFIX = '[NaverBlogPoster]'

export function logInfo(message: string, ...args: unknown[]): void {
  console.log(`${LOG_PREFIX} [INFO] ${message}`, ...args)
}

export function logError(message: string, ...args: unknown[]): void {
  console.error(`${LOG_PREFIX} [ERROR] ${message}`, ...args)
}

export function logWarn(message: string, ...args: unknown[]): void {
  console.warn(`${LOG_PREFIX} [WARN] ${message}`, ...args)
}

export function logDebug(message: string, ...args: unknown[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`${LOG_PREFIX} [DEBUG] ${message}`, ...args)
  }
}
