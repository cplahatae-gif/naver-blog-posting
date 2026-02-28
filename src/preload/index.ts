import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from './index.d'

const api: ElectronAPI = {
  // 포스팅
  startPosting: (data) => ipcRenderer.invoke('posting:start', data),
  cancelPosting: () => ipcRenderer.invoke('posting:cancel'),
  onPostingStatus: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, status: unknown) =>
      callback(status as Parameters<typeof callback>[0])
    ipcRenderer.on('posting:status', handler)
    return () => ipcRenderer.removeListener('posting:status', handler)
  },
  onManualRequired: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, info: unknown) =>
      callback(info as Parameters<typeof callback>[0])
    ipcRenderer.on('posting:manual-required', handler)
    return () => ipcRenderer.removeListener('posting:manual-required', handler)
  },

  // 인증
  testLogin: () => ipcRenderer.invoke('auth:login-test'),
  saveCredential: (cred) => ipcRenderer.invoke('credential:save', cred),
  getCredential: () => ipcRenderer.invoke('credential:get'),

  // 설정
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings) => ipcRenderer.invoke('settings:set', settings),

  // 마크다운
  convertMarkdown: (markdown) => ipcRenderer.invoke('markdown:convert', markdown),

  // 카테고리
  fetchCategories: () => ipcRenderer.invoke('category:fetch')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.api = api
}
