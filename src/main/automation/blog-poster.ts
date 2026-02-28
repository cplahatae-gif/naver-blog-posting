import { getBrowserContext } from './browser-manager'
import { ensureLogin } from './naver-login'
import { convertMarkdown } from '../services/markdown-converter'
import { getSettings } from '../services/settings-store'
import { randomDelay, clipboardPasteHtml } from './human-behavior'
import { logInfo, logError, logWarn } from '../utils/logger'
import type { PostData, PostResult, StatusCallback } from './types'
import type { Page, FrameLocator, Frame } from 'playwright-core'

let currentPage: Page | null = null
let isCancelled = false

// 포스팅 취소
export async function cancelPosting(): Promise<void> {
  isCancelled = true
  if (currentPage) {
    await currentPage.close().catch(() => {})
    currentPage = null
  }
}

// 메인 포스팅 함수
export async function startPosting(
  data: PostData,
  onStatus: StatusCallback
): Promise<PostResult> {
  isCancelled = false
  const settings = getSettings()

  if (!settings.blogId) {
    return { success: false, error: '블로그 ID가 설정되지 않았습니다' }
  }

  try {
    // 1단계: 로그인 확인
    onStatus({ step: 'login', progress: 10, message: '로그인 확인 중...' })
    const loggedIn = await ensureLogin()
    if (!loggedIn) {
      return { success: false, error: '로그인에 실패했습니다. 계정 정보를 확인해주세요.' }
    }
    if (isCancelled) return { success: false, error: '사용자가 취소했습니다' }

    // 2단계: 글쓰기 페이지 진입
    onStatus({ step: 'navigate', progress: 20, message: '글쓰기 페이지 진입 중...' })
    const context = await getBrowserContext()
    currentPage = await context.newPage()

    // 네이버 블로그 글쓰기 URL (두 가지 형식 시도)
    const writeUrl = `https://blog.naver.com/${settings.blogId}/postwrite`
    logInfo('글쓰기 페이지 접속:', writeUrl)

    await currentPage.goto(writeUrl, {
      waitUntil: 'load',
      timeout: 60000
    })

    // 에디터 로딩 대기 (SPA이므로 충분히 기다림)
    logInfo('에디터 로딩 대기 중...')
    await randomDelay(5000, 8000)
    if (isCancelled) return { success: false, error: '사용자가 취소했습니다' }

    // 팝업 처리
    await handlePopups(currentPage)

    // 3단계: 에디터 프레임 찾기
    onStatus({ step: 'editor', progress: 30, message: '에디터 로딩 대기 중...' })
    const editorFrame = await findEditorFrame(currentPage)
    if (!editorFrame) {
      // iframe 없이 직접 페이지에 에디터가 있는 경우
      logInfo('iframe 없이 에디터 직접 접근')
    }
    if (isCancelled) return { success: false, error: '사용자가 취소했습니다' }

    // 현재 페이지 URL 로그
    logInfo('현재 URL:', currentPage.url())

    // 4단계: 제목 입력
    onStatus({ step: 'title', progress: 40, message: '제목 입력 중...' })
    await inputTitle(currentPage, editorFrame, data.title)
    if (isCancelled) return { success: false, error: '사용자가 취소했습니다' }

    // 5단계: 본문 입력
    onStatus({ step: 'content', progress: 55, message: '본문 입력 중...' })
    const html = convertMarkdown(data.markdown)
    await inputContent(currentPage, editorFrame, html)
    if (isCancelled) return { success: false, error: '사용자가 취소했습니다' }

    // 6단계: 카테고리 설정
    if (data.category) {
      onStatus({ step: 'category', progress: 70, message: '카테고리 설정 중...' })
      await selectCategory(currentPage, editorFrame, data.category)
    }
    if (isCancelled) return { success: false, error: '사용자가 취소했습니다' }

    // 7단계: 태그 입력
    if (data.tags && data.tags.length > 0) {
      onStatus({ step: 'tags', progress: 80, message: '태그 입력 중...' })
      await inputTags(currentPage, editorFrame, data.tags)
    }
    if (isCancelled) return { success: false, error: '사용자가 취소했습니다' }

    // 8단계: 발행
    onStatus({ step: 'publish', progress: 90, message: '발행 중...' })
    const postUrl = await publish(currentPage, editorFrame)

    onStatus({ step: 'done', progress: 100, message: '포스팅 완료!' })
    logInfo('포스팅 완료:', postUrl)

    await currentPage.close()
    currentPage = null

    return { success: true, postUrl }
  } catch (error) {
    logError('포스팅 실패:', error)
    // 디버깅용: 실패 시 페이지 스크린샷 및 HTML 로그
    if (currentPage) {
      try {
        const url = currentPage.url()
        logError('실패 시 URL:', url)
        // 페이지 내 iframe 목록 출력
        const frames = currentPage.frames()
        logError('페이지 프레임 목록:', frames.map(f => `${f.name()} - ${f.url()}`))
      } catch { /* 무시 */ }
      await currentPage.close().catch(() => {})
      currentPage = null
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

// 에디터 프레임 찾기 (iframe 구조 자동 탐지)
async function findEditorFrame(page: Page): Promise<FrameLocator | null> {
  // 페이지 내 모든 프레임 로그
  const frames = page.frames()
  logInfo('감지된 프레임 수:', frames.length)
  for (const frame of frames) {
    logInfo(`  프레임: name="${frame.name()}" url="${frame.url()}"`)
  }

  // iframe 선택자 목록 (우선순위순)
  const frameSelectors = [
    '#mainFrame',
    'iframe[name="mainFrame"]',
    'iframe#se-editor',
    'iframe[src*="postwrite"]',
    'iframe[src*="PostWrite"]',
    'iframe'
  ]

  for (const selector of frameSelectors) {
    try {
      const frameLocator = page.frameLocator(selector)
      // 프레임 안에 에디터 관련 요소가 있는지 빠르게 확인
      const hasEditor = await frameLocator
        .locator('.se-component, .se-editor, .se-toolbar, [class*="editor"]')
        .first()
        .waitFor({ timeout: 3000, state: 'visible' })
        .then(() => true)
        .catch(() => false)

      if (hasEditor) {
        logInfo('에디터 프레임 발견:', selector)
        return frameLocator
      }
    } catch {
      // 다음 선택자 시도
    }
  }

  // iframe이 없을 수 있음 (SPA 구조)
  logWarn('에디터 iframe을 찾지 못함, 직접 페이지에서 시도')
  return null
}

// 팝업 닫기
async function handlePopups(page: Page): Promise<void> {
  try {
    // "작성 중인 글이 있습니다" 팝업
    const newPostBtn = await page.$('button:has-text("새로 작성")')
    if (newPostBtn) {
      await newPostBtn.click()
      await randomDelay(1000, 2000)
      logInfo('기존 글 작성 팝업 처리 완료')
    }
  } catch {
    // 팝업이 없으면 무시
  }

  try {
    // 가이드/도움말 팝업
    const closeBtn = await page.$('.popup_close, .btn_close')
    if (closeBtn) {
      await closeBtn.click()
      await randomDelay(500, 1000)
    }
  } catch {
    // 무시
  }

  // iframe 내부 팝업도 처리 시도
  try {
    const mainFrame = page.frameLocator('#mainFrame')
    const closeBtn = await mainFrame.locator('.popup_close, .btn_close, [class*="close"]').first()
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click()
      await randomDelay(500, 1000)
      logInfo('iframe 내부 팝업 처리 완료')
    }
  } catch {
    // 무시
  }
}

// 요소 찾기 (여러 선택자 순차 시도)
async function findElement(
  container: FrameLocator | Page,
  selectors: string[],
  label: string,
  timeout = 10000
): Promise<string> {
  for (const selector of selectors) {
    try {
      if ('frameLocator' in container) {
        // Page인 경우
        await (container as Page).locator(selector).first()
          .waitFor({ timeout: Math.min(timeout, 5000), state: 'visible' })
        logInfo(`${label} 선택자 발견:`, selector)
        return selector
      } else {
        // FrameLocator인 경우
        await (container as FrameLocator).locator(selector).first()
          .waitFor({ timeout: Math.min(timeout, 5000), state: 'visible' })
        logInfo(`${label} 선택자 발견:`, selector)
        return selector
      }
    } catch {
      logWarn(`${label} 선택자 실패: ${selector}`)
    }
  }
  throw new Error(`${label} 영역을 찾을 수 없습니다. 시도한 선택자: ${selectors.join(', ')}`)
}

// 제목 입력 (클립보드 붙여넣기 방식 — 한글 지원)
async function inputTitle(
  page: Page,
  frame: FrameLocator | null,
  title: string
): Promise<void> {
  const titleSelectors = [
    '.se-title-text .se-text-paragraph',
    '.se-documentTitle .se-text-paragraph',
    '.se-section-title .se-text-paragraph',
    '.se-title .se-text-paragraph',
    '[class*="title"] .se-text-paragraph',
    '.se-text-paragraph-title',
    '[data-placeholder*="제목"]',
    '[placeholder*="제목"]',
    '.title_area input',
    '.tit_area input'
  ]

  // iframe 안에서 먼저 시도, 없으면 페이지에서 직접 시도
  const containers: Array<{ target: FrameLocator | Page; label: string }> = []
  if (frame) containers.push({ target: frame, label: 'iframe' })
  containers.push({ target: page, label: 'page' })

  let found = false
  for (const { target, label } of containers) {
    for (const selector of titleSelectors) {
      try {
        const locator = 'locator' in target
          ? target.locator(selector).first()
          : target.locator(selector).first()

        await locator.waitFor({ timeout: 5000, state: 'visible' })
        await locator.click()
        await randomDelay(300, 600)

        logInfo(`제목 영역 클릭 성공 (${label}):`, selector)
        found = true
        break
      } catch {
        // 다음 선택자 시도
      }
    }
    if (found) break
  }

  if (!found) {
    // 최후의 수단: 페이지의 모든 프레임에서 검색
    logWarn('기본 선택자로 제목 영역을 찾지 못함, 모든 프레임 탐색 중...')
    const frames = page.frames()
    for (const f of frames) {
      for (const selector of titleSelectors) {
        try {
          await f.locator(selector).first().waitFor({ timeout: 3000, state: 'visible' })
          await f.locator(selector).first().click()
          await randomDelay(300, 600)
          logInfo(`제목 영역 발견 (프레임 ${f.name()}):`, selector)
          found = true
          break
        } catch {
          // 다음 시도
        }
      }
      if (found) break
    }
  }

  if (!found) {
    throw new Error('제목 입력 영역을 찾을 수 없습니다')
  }

  // 클립보드에 제목 텍스트 설정 후 붙여넣기
  try {
    await page.evaluate(async (t) => {
      await navigator.clipboard.writeText(t)
    }, title)
    await randomDelay(100, 300)
    await page.keyboard.press('Control+V')
    await randomDelay(300, 600)
  } catch {
    // 클립보드 API 실패 시 insertText 폴백
    logWarn('클립보드 API 실패, insertText로 대체')
    await page.keyboard.insertText(title)
    await randomDelay(300, 600)
  }

  // 제목 영역에서 나가기 (Enter로 본문 영역으로 이동)
  await page.keyboard.press('Enter')
  await randomDelay(500, 1000)

  logInfo('제목 입력 완료:', title)
}

// 본문 HTML 입력
async function inputContent(
  page: Page,
  frame: FrameLocator | null,
  html: string
): Promise<void> {
  // 제목이 아닌 본문 영역만 선택하는 선택자 (제목 영역 제외)
  const contentSelectors = [
    '.se-component:not(.se-documentTitle) .se-text-paragraph',
    '.se-module-text .se-text-paragraph',
    '.se-component-content .se-text-paragraph'
  ]

  // 본문 영역 클릭 시도
  let clicked = false
  const target = frame || page

  for (const selector of contentSelectors) {
    try {
      const locator = target.locator(selector).first()
      await locator.waitFor({ timeout: 5000, state: 'visible' })
      await locator.click()
      await randomDelay(500, 1000)
      logInfo('본문 영역 클릭 성공:', selector)
      clicked = true
      break
    } catch {
      logWarn('본문 선택자 실패:', selector)
    }
  }

  // 폴백: 제목 다음 본문 영역을 직접 찾기
  if (!clicked) {
    try {
      // 전체 선택 해제 후 본문 placeholder 클릭
      const placeholder = target.locator('[data-placeholder*="글감"], [data-placeholder*="일상"]').first()
      await placeholder.waitFor({ timeout: 3000, state: 'visible' })
      await placeholder.click()
      await randomDelay(500, 1000)
      logInfo('본문 placeholder 클릭 성공')
      clicked = true
    } catch {
      logWarn('본문 placeholder 찾기 실패')
    }
  }

  // 최종 폴백: 이미 제목 입력 후 Enter로 본문에 커서가 있을 수 있음
  if (!clicked) {
    logWarn('본문 영역을 직접 찾지 못함 — 현재 커서 위치에서 입력 시도')
  }

  // 전략 A: 클립보드 HTML 붙여넣기
  try {
    await clipboardPasteHtml(page, html)
    await randomDelay(500, 1000)
    logInfo('클립보드 HTML 붙여넣기 완료')
    return
  } catch (error) {
    logError('클립보드 HTML 붙여넣기 실패, insertText로 전환:', error)
  }

  // 전략 B: keyboard.insertText로 plain text 삽입
  try {
    const plainText = html.replace(/<[^>]*>/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
    await page.keyboard.insertText(plainText)
    logInfo('plain text 삽입으로 본문 입력 완료')
  } catch (error) {
    logError('본문 입력 실패:', error)
    throw new Error('본문 입력에 실패했습니다')
  }
}

// 카테고리 선택
async function selectCategory(
  page: Page,
  frame: FrameLocator | null,
  category: string
): Promise<void> {
  try {
    const categorySelectors = [
      '.se-category-button',
      '.post_category',
      '[class*="category"] button',
      '[class*="category"] select'
    ]

    const target = frame || page
    for (const selector of categorySelectors) {
      try {
        await target.locator(selector).first()
          .waitFor({ timeout: 3000, state: 'visible' })
        await target.locator(selector).first().click()
        await randomDelay(800, 1500)

        // 카테고리 목록에서 일치하는 항목 클릭
        await target.locator(`text=${category}`).first().click()
        await randomDelay(500, 1000)
        logInfo('카테고리 선택 완료:', category)
        return
      } catch {
        // 다음 선택자 시도
      }
    }
    logWarn('카테고리 선택 실패 — 무시하고 계속 진행')
  } catch (error) {
    logError('카테고리 선택 실패:', error)
  }
}

// 태그 입력 (keyboard.type 사용 — 한글 지원)
async function inputTags(
  page: Page,
  frame: FrameLocator | null,
  tags: string[]
): Promise<void> {
  try {
    const tagSelectors = [
      '.se-tag-input input',
      '#post-tag',
      '[class*="tag"] input',
      '[placeholder*="태그"]',
      '[placeholder*="tag"]'
    ]

    const target = frame || page
    let tagClicked = false

    for (const selector of tagSelectors) {
      try {
        await target.locator(selector).first()
          .waitFor({ timeout: 3000, state: 'visible' })
        await target.locator(selector).first().click()
        await randomDelay(300, 600)
        tagClicked = true
        logInfo('태그 입력 영역 발견:', selector)
        break
      } catch {
        // 다음 시도
      }
    }

    if (!tagClicked) {
      logWarn('태그 입력 영역을 찾지 못함 — 무시하고 계속 진행')
      return
    }

    for (const tag of tags) {
      await page.keyboard.type(tag, { delay: 80 })
      await randomDelay(200, 400)
      await page.keyboard.press('Enter')
      await randomDelay(300, 800)
    }
    logInfo('태그 입력 완료:', tags)
  } catch (error) {
    logError('태그 입력 실패:', error)
  }
}

// 발행
async function publish(
  page: Page,
  frame: FrameLocator | null
): Promise<string | undefined> {
  const publishSelectors = [
    'button:has-text("발행")',
    '.publish_btn__Y9Mzm',
    '[class*="publish"] button',
    'button:has-text("공개발행")',
    'button:has-text("등록")'
  ]

  const target = frame || page

  // 발행 버튼 찾기 및 클릭
  for (const selector of publishSelectors) {
    try {
      await target.locator(selector).first()
        .waitFor({ timeout: 5000, state: 'visible' })
      await target.locator(selector).first().click()
      await randomDelay(1500, 3000)
      logInfo('발행 버튼 클릭:', selector)
      break
    } catch {
      // 다음 시도
    }
  }

  // 발행 확인 다이얼로그 (두 번째 발행 버튼)
  try {
    for (const selector of publishSelectors) {
      try {
        const btn = target.locator(selector).last()
        if (await btn.isVisible().catch(() => false)) {
          await btn.click()
          await randomDelay(3000, 5000)
          logInfo('발행 확인 클릭')
          break
        }
      } catch {
        // 무시
      }
    }
  } catch {
    // 확인 다이얼로그가 없으면 이미 발행됨
  }

  // 발행 후 URL 추출 시도
  await randomDelay(2000, 3000)
  const currentUrl = page.url()
  if (currentUrl.includes('/postview') || currentUrl.includes('/PostView')) {
    logInfo('발행 완료, 포스트 URL:', currentUrl)
    return currentUrl
  }

  logInfo('발행 완료')
  return undefined
}
