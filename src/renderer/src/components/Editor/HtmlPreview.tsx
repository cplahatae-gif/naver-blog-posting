interface Props {
  html: string
}

export default function HtmlPreview({ html }: Props) {
  return (
    <div className="h-full overflow-auto p-4 bg-white">
      {html ? (
        <div
          className="preview-content prose max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          <p>마크다운을 입력하면 미리보기가 표시됩니다</p>
        </div>
      )}
    </div>
  )
}
