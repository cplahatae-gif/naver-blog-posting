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

export type StatusCallback = (status: PostingStatus) => void
