import { ipcMain, BrowserWindow } from 'electron'
import { getSettings, setSettings } from './services/settings-store'
import { getCredential, saveCredential } from './services/credential-store'
import { convertMarkdown } from './services/markdown-converter'
import { startPosting, cancelPosting } from './automation/blog-poster'
import { testLogin } from './automation/naver-login'

export function registerIpcHandlers(): void {
  // 설정 관련
  ipcMain.handle('settings:get', () => {
    return getSettings()
  })

  ipcMain.handle('settings:set', (_event, settings) => {
    setSettings(settings)
    return { success: true }
  })

  // 자격증명 관련
  ipcMain.handle('credential:get', () => {
    return getCredential()
  })

  ipcMain.handle('credential:save', (_event, credential) => {
    saveCredential(credential)
    return { success: true }
  })

  // 마크다운 변환
  ipcMain.handle('markdown:convert', (_event, markdown: string) => {
    return { html: convertMarkdown(markdown) }
  })

  // 로그인 테스트
  ipcMain.handle('auth:login-test', async () => {
    return await testLogin()
  })

  // 포스팅 시작
  ipcMain.handle('posting:start', async (event, data) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    return await startPosting(data, (status) => {
      window?.webContents.send('posting:status', status)
    })
  })

  // 포스팅 취소
  ipcMain.handle('posting:cancel', async () => {
    await cancelPosting()
    return { success: true }
  })
}
