import { useState } from 'react'
import type { AppSettings, CredentialInfo } from '../../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  settings: AppSettings
  credential: CredentialInfo
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>
  onSaveCredential: (id: string, password: string) => Promise<void>
}

export default function SettingsDialog({
  isOpen,
  onClose,
  settings,
  credential,
  onUpdateSettings,
  onSaveCredential
}: Props) {
  const [blogId, setBlogId] = useState(settings.blogId)
  const [naverId, setNaverId] = useState(credential.id)
  const [naverPw, setNaverPw] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdateSettings({ blogId })
      if (naverId && naverPw) {
        await onSaveCredential(naverId, naverPw)
      }
      onClose()
    } catch (error) {
      console.error('설정 저장 실패:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-[480px] max-h-[80vh] overflow-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">설정</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            &times;
          </button>
        </div>

        {/* 내용 */}
        <div className="px-6 py-4 space-y-5">
          {/* 네이버 계정 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">네이버 계정</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">네이버 ID</label>
                <input
                  type="text"
                  value={naverId}
                  onChange={(e) => setNaverId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="네이버 아이디"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  비밀번호 {credential.hasPassword && '(저장됨)'}
                </label>
                <input
                  type="password"
                  value={naverPw}
                  onChange={(e) => setNaverPw(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={credential.hasPassword ? '변경하려면 새 비밀번호 입력' : '비밀번호'}
                />
              </div>
            </div>
          </section>

          {/* 블로그 설정 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">블로그 설정</h3>
            <div>
              <label className="block text-sm text-gray-600 mb-1">블로그 ID</label>
              <input
                type="text"
                value={blogId}
                onChange={(e) => setBlogId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="blog.naver.com/여기에 들어갈 ID"
              />
              <p className="text-xs text-gray-400 mt-1">
                blog.naver.com/{blogId || '___'} 형태의 블로그 주소
              </p>
            </div>
          </section>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700
              rounded-lg disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
