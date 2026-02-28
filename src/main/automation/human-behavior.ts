import type { Page } from 'playwright-core'

// 가우시안 분포 기반 랜덤 값 생성 (Box-Muller 변환)
function gaussianRandom(mean: number, stdDev: number): number {
  const u1 = Math.random()
  const u2 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mean + z * stdDev
}

// 범위 제한
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// 자연스러운 랜덤 딜레이
export async function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const mean = (minMs + maxMs) / 2
  const stdDev = (maxMs - minMs) / 6
  const delay = clamp(gaussianRandom(mean, stdDev), minMs, maxMs)
  return new Promise((resolve) => setTimeout(resolve, Math.round(delay)))
}

// 사람처럼 자연스러운 타이핑
export async function humanType(page: Page, selector: string, text: string): Promise<void> {
  await page.click(selector)
  await randomDelay(200, 500)

  for (const char of text) {
    await page.keyboard.type(char)

    // 5% 확률로 긴 멈춤 (사람이 생각하는 것처럼)
    if (Math.random() < 0.05) {
      await randomDelay(300, 600)
    } else {
      await randomDelay(50, 180)
    }
  }
}

// 클립보드 붙여넣기 방식 입력 (봇 탐지 회피용)
export async function clipboardPaste(page: Page, selector: string, text: string): Promise<void> {
  await page.click(selector)
  await randomDelay(200, 400)

  // 기존 내용 선택 후 삭제
  await page.keyboard.press('Control+A')
  await randomDelay(100, 200)

  // 클립보드에 텍스트 설정 후 붙여넣기
  await page.evaluate((t) => navigator.clipboard.writeText(t), text)
  await randomDelay(100, 300)
  await page.keyboard.press('Control+V')
  await randomDelay(300, 600)
}

// 클립보드에 HTML을 설정하고 붙여넣기
export async function clipboardPasteHtml(page: Page, html: string): Promise<void> {
  await page.evaluate((htmlContent) => {
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([htmlContent], { type: 'text/html' }),
      'text/plain': new Blob([htmlContent], { type: 'text/plain' })
    })
    navigator.clipboard.write([clipboardItem])
  }, html)

  await randomDelay(200, 400)
  await page.keyboard.press('Control+V')
  await randomDelay(500, 1000)
}

// 자연스러운 마우스 이동 후 클릭
export async function humanClick(page: Page, selector: string): Promise<void> {
  const element = await page.$(selector)
  if (!element) return

  const box = await element.boundingBox()
  if (!box) return

  // 정중앙이 아닌 약간 랜덤한 위치 클릭
  const offsetX = box.width * (0.3 + Math.random() * 0.4)
  const offsetY = box.height * (0.3 + Math.random() * 0.4)

  await page.mouse.click(box.x + offsetX, box.y + offsetY)
  await randomDelay(200, 500)
}
