import type { PostingStatus, PostResult } from '../../types'

const STEPS = [
  { key: 'login', label: '네이버 로그인' },
  { key: 'navigate', label: '글쓰기 페이지 진입' },
  { key: 'title', label: '제목 입력' },
  { key: 'content', label: '본문 입력' },
  { key: 'category', label: '카테고리 설정' },
  { key: 'tags', label: '태그 입력' },
  { key: 'publish', label: '발행' }
]

interface Props {
  isPosting: boolean
  status: PostingStatus | null
  result: PostResult | null
  onCancel: () => void
  onClose: () => void
}

export default function PostingOverlay({
  isPosting,
  status,
  result,
  onCancel,
  onClose
}: Props) {
  if (!isPosting && !result) return null

  const currentStepIndex = STEPS.findIndex((s) => s.key === status?.step)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-[440px] p-6">
        {/* 결과 표시 */}
        {result && !isPosting ? (
          <div className="text-center">
            {result.success ? (
              <>
                <div className="text-5xl mb-4">&#10003;</div>
                <h3 className="text-lg font-bold text-green-700 mb-2">포스팅 완료!</h3>
                {result.postUrl && (
                  <p className="text-sm text-gray-500 mb-4 break-all">{result.postUrl}</p>
                )}
              </>
            ) : (
              <>
                <div className="text-5xl mb-4 text-red-500">!</div>
                <h3 className="text-lg font-bold text-red-700 mb-2">포스팅 실패</h3>
                <p className="text-sm text-gray-500 mb-4">{result.error}</p>
              </>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            {/* 진행 중 */}
            <h3 className="text-lg font-bold mb-4 text-center">
              네이버 블로그 포스팅 진행 중...
            </h3>

            {/* 프로그레스 바 */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-5">
              <div
                className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${status?.progress || 0}%` }}
              />
            </div>

            {/* 단계 목록 */}
            <div className="space-y-2 mb-5">
              {STEPS.map((step, i) => {
                const isDone = i < currentStepIndex
                const isCurrent = i === currentStepIndex
                return (
                  <div key={step.key} className="flex items-center gap-2 text-sm">
                    {isDone ? (
                      <span className="text-green-600 font-bold">&#10003;</span>
                    ) : isCurrent ? (
                      <span className="inline-block w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="inline-block w-3 h-3 rounded-full border border-gray-300" />
                    )}
                    <span className={isCurrent ? 'text-green-700 font-medium' : isDone ? 'text-gray-500' : 'text-gray-400'}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* 현재 메시지 */}
            {status?.message && (
              <p className="text-xs text-gray-500 text-center mb-4">{status.message}</p>
            )}

            <div className="text-center">
              <button
                onClick={onCancel}
                className="px-6 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
              >
                취소
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
