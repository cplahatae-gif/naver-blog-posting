import { useState, useCallback, useEffect, useRef } from 'react'

export function useMarkdown() {
  const [markdown, setMarkdown] = useState('')
  const [html, setHtml] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // 마크다운 변경 시 디바운스로 HTML 변환
  const updateMarkdown = useCallback((value: string) => {
    setMarkdown(value)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await window.api.convertMarkdown(value)
        setHtml(result.html)
      } catch (error) {
        console.error('마크다운 변환 실패:', error)
      }
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return { markdown, html, updateMarkdown }
}
