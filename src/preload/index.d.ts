// 포스팅 데이터
export interface PostData {
  title: string
  markdown: string
  category?: string
  tags?: string[]
}

// 포스팅 결과
export interface PostResult {
  success: boolean
  postUrl?: string
  error?: string
}

// 포스팅 진행 상태
export interface PostingStatus {
  step: string
  progress: number
  message: string
}

// 수동 처리 필요 정보
export interface ManualRequiredInfo {
  reason: 'captcha' | '2fa'
}

// 로그인 상태
export interface LoginStatus {
  loggedIn: boolean
  userId?: string
}

// 자격증명
export interface Credential {
  id: string
  password: string
}

// 자격증명 정보 (비밀번호 제외)
export interface CredentialInfo {
  id: string
  hasPassword: boolean
}

// 앱 설정
export interface AppSettings {
  blogId: string
  defaultCategory: string
  defaultTags: string[]
  delayMin: number
  delayMax: number
  editorFontSize: number
  theme: 'light' | 'dark'
}

// Preload API 인터페이스
export interface ElectronAPI {
  // 포스팅
  startPosting: (data: PostData) => Promise<PostResult>
  cancelPosting: () => Promise<{ success: boolean }>
  onPostingStatus: (callback: (status: PostingStatus) => void) => () => void
  onManualRequired: (callback: (info: ManualRequiredInfo) => void) => () => void

  // 인증
  testLogin: () => Promise<LoginStatus>
  saveCredential: (cred: Credential) => Promise<{ success: boolean }>
  getCredential: () => Promise<CredentialInfo>

  // 설정
  getSettings: () => Promise<AppSettings>
  setSettings: (settings: Partial<AppSettings>) => Promise<{ success: boolean }>

  // 마크다운
  convertMarkdown: (markdown: string) => Promise<{ html: string }>

  // 카테고리
  fetchCategories: () => Promise<{ categories: string[] }>
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
