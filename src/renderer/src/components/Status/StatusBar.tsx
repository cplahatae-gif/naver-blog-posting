interface Props {
  isPosting: boolean
  message?: string
}

export default function StatusBar({ isPosting, message }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-t text-sm">
      <div className="flex items-center gap-2">
        {isPosting ? (
          <>
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-yellow-700">{message || '포스팅 진행 중...'}</span>
          </>
        ) : (
          <>
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-600">준비 완료</span>
          </>
        )}
      </div>
    </div>
  )
}
