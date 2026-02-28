import { chromium, type BrowserContext } from 'playwright-core'
import { app } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { logInfo, logError, logWarn } from '../utils/logger'

let browserContext: BrowserContext | null = null

// 사용자 PC에 설치된 Chrome 경로 탐색
function findChromePath(): string | undefined {
  const possiblePaths = [
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    join(
      process.env.LOCALAPPDATA || '',
      'Google\\Chrome\\Application\\chrome.exe'
    )
  ]

  for (const p of possiblePaths) {
    if (p && existsSync(p)) {
      return p
    }
  }
  return undefined
}

export async function getBrowserContext(): Promise<BrowserContext> {
  if (browserContext) return browserContext

  const userDataDir = join(app.getPath('userData'), 'playwright-session')
  const chromePath = findChromePath()

  if (chromePath) {
    logInfo('사용자 Chrome 발견:', chromePath)
  } else {
    logWarn('Chrome을 찾을 수 없습니다. Playwright 내장 Chromium을 사용합니다.')
  }

  try {
    browserContext = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      executablePath: chromePath,
      viewport: { width: 1280, height: 800 },
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      ignoreDefaultArgs: ['--enable-automation']
    })

    logInfo('브라우저 컨텍스트 생성 완료')
    return browserContext
  } catch (error) {
    logError('브라우저 시작 실패:', error)
    throw error
  }
}

export async function closeBrowserContext(): Promise<void> {
  if (browserContext) {
    await browserContext.close()
    browserContext = null
    logInfo('브라우저 컨텍스트 종료')
  }
}

// 세션 데이터 초기화
export async function clearSession(): Promise<void> {
  await closeBrowserContext()
  const { rm } = await import('fs/promises')
  const sessionDir = join(app.getPath('userData'), 'playwright-session')
  try {
    await rm(sessionDir, { recursive: true, force: true })
    logInfo('세션 데이터 초기화 완료')
  } catch {
    logWarn('세션 데이터 초기화 실패')
  }
}
