import { useState } from 'react'
import MarkdownEditor from './components/Editor/MarkdownEditor'
import HtmlPreview from './components/Editor/HtmlPreview'
import TitleInput from './components/PostForm/TitleInput'
import CategorySelect from './components/PostForm/CategorySelect'
import TagInput from './components/PostForm/TagInput'
import SettingsDialog from './components/Settings/SettingsDialog'
import StatusBar from './components/Status/StatusBar'
import PostingOverlay from './components/Status/PostingOverlay'
import { useMarkdown } from './hooks/useMarkdown'
import { usePosting } from './hooks/usePosting'
import { useSettings } from './hooks/useSettings'

export default function App() {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const { markdown, html, updateMarkdown } = useMarkdown()
  const { isPosting, status, result, startPosting, cancelPosting, resetResult } = usePosting()
  const { settings, credential, updateSettings, saveCredential } = useSettings()

  const handlePost = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요')
      return
    }
    if (!markdown.trim()) {
      alert('본문을 입력해주세요')
      return
    }
    if (!settings.blogId) {
      alert('설정에서 블로그 ID를 먼저 입력해주세요')
      setIsSettingsOpen(true)
      return
    }
    if (!credential.hasPassword) {
      alert('설정에서 네이버 계정 정보를 먼저 입력해주세요')
      setIsSettingsOpen(true)
      return
    }

    await startPosting({
      title,
      markdown,
      category: category || undefined,
      tags: tags.length > 0 ? tags : undefined
    })
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
        <h1 className="text-lg font-bold text-green-700">네이버 블로그 포스터</h1>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          title="설정"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {/* 포스트 메타 정보 */}
      <div className="px-4 py-3 bg-white border-b space-y-2">
        <TitleInput value={title} onChange={setTitle} />
        <div className="flex items-center gap-3">
          <CategorySelect value={category} onChange={setCategory} />
          <div className="flex-1">
            <TagInput tags={tags} onChange={setTags} />
          </div>
        </div>
      </div>

      {/* 에디터 / 미리보기 (좌우 분할) */}
      <div className="flex flex-1 overflow-hidden">
        {/* 마크다운 에디터 */}
        <div className="w-1/2 border-r flex flex-col">
          <div className="px-3 py-1.5 bg-gray-100 border-b text-xs font-medium text-gray-500">
            마크다운
          </div>
          <div className="flex-1 overflow-hidden">
            <MarkdownEditor
              value={markdown}
              onChange={updateMarkdown}
              fontSize={settings.editorFontSize}
            />
          </div>
        </div>

        {/* HTML 미리보기 */}
        <div className="w-1/2 flex flex-col">
          <div className="px-3 py-1.5 bg-gray-100 border-b text-xs font-medium text-gray-500">
            미리보기
          </div>
          <div className="flex-1 overflow-hidden">
            <HtmlPreview html={html} />
          </div>
        </div>
      </div>

      {/* 하단 상태바 + 포스팅 버튼 */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-t">
        <StatusBar isPosting={isPosting} message={status?.message} />
        <button
          onClick={handlePost}
          disabled={isPosting}
          className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700
            rounded-lg disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center gap-2 shadow-sm"
        >
          <span>네이버에 포스팅</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>

      {/* 설정 다이얼로그 */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        credential={credential}
        onUpdateSettings={updateSettings}
        onSaveCredential={saveCredential}
      />

      {/* 포스팅 진행 오버레이 */}
      <PostingOverlay
        isPosting={isPosting}
        status={status}
        result={result}
        onCancel={cancelPosting}
        onClose={resetResult}
      />
    </div>
  )
}
