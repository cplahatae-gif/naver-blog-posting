export interface PostData {
  title: string
  markdown: string
  category?: string
  tags?: string[]
}

export interface PostResult {
  success: boolean
  postUrl?: string
  error?: string
}

export interface PostingStatus {
  step: string
  progress: number
  message: string
}

export interface AppSettings {
  blogId: string
  defaultCategory: string
  defaultTags: string[]
  delayMin: number
  delayMax: number
  editorFontSize: number
  theme: 'light' | 'dark'
}

export interface CredentialInfo {
  id: string
  hasPassword: boolean
}
