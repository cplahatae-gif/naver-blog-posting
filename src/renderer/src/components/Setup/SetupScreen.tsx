import { useState } from 'react'

interface Props {
  onComplete: (data: { naverId: string; password: string; blogId: string }) => Promise<void>
}

export default function SetupScreen({ onComplete }: Props) {
  const [naverId, setNaverId] = useState('')
  const [password, setPassword] = useState('')
  const [blogId, setBlogId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!naverId.trim()) {
      setError('네이버 아이디를 입력해주세요')
      return
    }
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요')
      return
    }
    if (!blogId.trim()) {
      setError('블로그 ID를 입력해주세요')
      return
    }

    setIsSaving(true)
    try {
      await onComplete({ naverId: naverId.trim(), password, blogId: blogId.trim() })
    } catch (err) {
      setError('저장 중 오류가 발생했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-green-50 to-white">
      <form onSubmit={handleSubmit} className="w-[420px] bg-white rounded-2xl shadow-lg border p-8">
        {/* 로고 / 타이틀 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-2xl mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">네이버 블로그 포스터</h1>
          <p className="text-sm text-gray-500 mt-1">시작하려면 네이버 계정 정보를 입력하세요</p>
        </div>

        {/* 입력 필드 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">네이버 아이디</label>
            <input
              type="text"
              value={naverId}
              onChange={(e) => setNaverId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="naver_id"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="비밀번호 (암호화 저장)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">블로그 ID</label>
            <input
              type="text"
              value={blogId}
              onChange={(e) => setBlogId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="blog.naver.com/여기에 들어갈 ID"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              blog.naver.com/<span className="text-green-600 font-medium">{blogId || '___'}</span>
            </p>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
        )}

        {/* 시작 버튼 */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full mt-6 px-4 py-3 text-sm font-medium text-white bg-green-600
            hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors"
        >
          {isSaving ? '저장 중...' : '시작하기'}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          비밀번호는 OS 보안 저장소에 암호화되어 저장됩니다
        </p>
      </form>
    </div>
  )
}
