import Store from 'electron-store'

interface AppSettings {
  blogId: string
  defaultCategory: string
  defaultTags: string[]
  delayMin: number
  delayMax: number
  editorFontSize: number
  theme: 'light' | 'dark'
}

const defaults: AppSettings = {
  blogId: '',
  defaultCategory: '',
  defaultTags: [],
  delayMin: 1000,
  delayMax: 3000,
  editorFontSize: 14,
  theme: 'light'
}

const store = new Store<AppSettings>({
  name: 'settings',
  defaults
})

export function getSettings(): AppSettings {
  return {
    blogId: store.get('blogId'),
    defaultCategory: store.get('defaultCategory'),
    defaultTags: store.get('defaultTags'),
    delayMin: store.get('delayMin'),
    delayMax: store.get('delayMax'),
    editorFontSize: store.get('editorFontSize'),
    theme: store.get('theme')
  }
}

export function setSettings(settings: Partial<AppSettings>): void {
  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined) {
      store.set(key as keyof AppSettings, value)
    }
  }
}
