import { useState, useCallback, useEffect } from 'react'
import type { AppSettings, CredentialInfo } from '../types'

const defaultSettings: AppSettings = {
  blogId: '',
  defaultCategory: '',
  defaultTags: [],
  delayMin: 1000,
  delayMax: 3000,
  editorFontSize: 14,
  theme: 'light'
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(defaultSettings)
  const [credential, setCredentialState] = useState<CredentialInfo>({
    id: '',
    hasPassword: false
  })
  const [isLoading, setIsLoading] = useState(true)

  // 설정 불러오기
  useEffect(() => {
    async function load() {
      try {
        const [s, c] = await Promise.all([
          window.api.getSettings(),
          window.api.getCredential()
        ])
        setSettingsState(s)
        setCredentialState(c)
      } catch (error) {
        console.error('설정 불러오기 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    await window.api.setSettings(partial)
    setSettingsState((prev) => ({ ...prev, ...partial }))
  }, [])

  const saveCredential = useCallback(async (id: string, password: string) => {
    await window.api.saveCredential({ id, password })
    setCredentialState({ id, hasPassword: true })
  }, [])

  return { settings, credential, isLoading, updateSettings, saveCredential }
}
