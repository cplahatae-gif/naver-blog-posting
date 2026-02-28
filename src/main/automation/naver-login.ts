import { getBrowserContext } from './browser-manager'
import { decryptPassword, getCredential } from '../services/credential-store'
import { clipboardPaste, randomDelay } from './human-behavior'
import { logInfo, logError } from '../utils/logger'

const NAVER_LOGIN_URL = 'https://nid.naver.com/nidlogin.login'
const NAVER_MAIN_URL = 'https://www.naver.com'

// 현재 로그인 상태 확인
export async function testLogin(): Promise<{ loggedIn: boolean; userId?: string }> {
  try {
    const context = await getBrowserContext()
    const page = await context.newPage()

    await page.goto(NAVER_MAIN_URL, { waitUntil: 'domcontentloaded' })
    await randomDelay(1000, 2000)

    // 로그인 상태 확인: 로그인 버튼 존재 여부로 판별
    const loginButton = await page.$('.MyView-module__link_login___HpHMW')
    const isLoggedIn = !loginButton

    let userId: string | undefined
    if (isLoggedIn) {
      // 로그인된 사용자 ID 추출 시도
      userId = await page.$eval(
        '.MyView-module__link_name___McfuB',
        (el) => el.textContent?.trim()
      ).catch(() => undefined)
    }

    await page.close()
    return { loggedIn: isLoggedIn, userId }
  } catch (error) {
    logError('로그인 상태 확인 실패:', error)
    return { loggedIn: false }
  }
}

// 네이버 로그인 수행
export async function performLogin(): Promise<boolean> {
  const credential = getCredential()
  if (!credential.id || !credential.hasPassword) {
    logError('저장된 자격증명이 없습니다')
    return false
  }

  const password = decryptPassword()
  if (!password) {
    logError('비밀번호 복호화 실패')
    return false
  }

  try {
    const context = await getBrowserContext()
    const page = await context.newPage()

    logInfo('네이버 로그인 페이지 접속 중...')
    await page.goto(NAVER_LOGIN_URL, { waitUntil: 'domcontentloaded' })
    await randomDelay(1500, 3000)

    // ID 입력 (클립보드 붙여넣기 방식)
    logInfo('ID 입력 중...')
    await clipboardPaste(page, '#id', credential.id)
    await randomDelay(500, 1000)

    // 비밀번호 입력 (클립보드 붙여넣기 방식)
    logInfo('비밀번호 입력 중...')
    await clipboardPaste(page, '#pw', password)
    await randomDelay(500, 1500)

    // 로그인 버튼 클릭
    logInfo('로그인 버튼 클릭...')
    await page.click('#log\\.login')
    await randomDelay(2000, 4000)

    // 로그인 결과 확인 (최대 120초 대기 - 캡차/2FA 수동 처리 시간)
    try {
      await page.waitForURL((url) => !url.href.includes('nidlogin'), {
        timeout: 120000
      })
      logInfo('로그인 성공')
      await page.close()
      return true
    } catch {
      // 아직 로그인 페이지에 있으면 캡차나 2FA 발생 가능
      const currentUrl = page.url()
      if (currentUrl.includes('nidlogin')) {
        logError('로그인 실패 - 캡차 또는 2FA 확인 필요')
        // 페이지를 닫지 않고 사용자가 수동으로 처리할 수 있게 유지
        return false
      }
      await page.close()
      return false
    }
  } catch (error) {
    logError('로그인 과정 오류:', error)
    return false
  }
}

// 로그인 보장 (이미 로그인 상태면 스킵)
export async function ensureLogin(): Promise<boolean> {
  const status = await testLogin()
  if (status.loggedIn) {
    logInfo('이미 로그인 상태입니다:', status.userId)
    return true
  }
  return await performLogin()
}
