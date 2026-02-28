import { useState, useCallback, useEffect } from 'react'
import type { PostData, PostingStatus, PostResult } from '../types'

export function usePosting() {
  const [isPosting, setIsPosting] = useState(false)
  const [status, setStatus] = useState<PostingStatus | null>(null)
  const [result, setResult] = useState<PostResult | null>(null)

  useEffect(() => {
    const unsubscribe = window.api.onPostingStatus((newStatus) => {
      setStatus(newStatus)
    })
    return unsubscribe
  }, [])

  const startPosting = useCallback(async (data: PostData) => {
    setIsPosting(true)
    setResult(null)
    setStatus({ step: 'start', progress: 0, message: '포스팅 시작...' })

    try {
      const postResult = await window.api.startPosting(data)
      setResult(postResult)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      })
    } finally {
      setIsPosting(false)
    }
  }, [])

  const cancelPosting = useCallback(async () => {
    await window.api.cancelPosting()
    setIsPosting(false)
    setStatus(null)
    setResult({ success: false, error: '사용자가 취소했습니다' })
  }, [])

  const resetResult = useCallback(() => {
    setResult(null)
    setStatus(null)
  }, [])

  return { isPosting, status, result, startPosting, cancelPosting, resetResult }
}
