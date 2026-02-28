interface Props {
  value: string
  onChange: (value: string) => void
}

export default function CategorySelect({ value, onChange }: Props) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="카테고리 입력 (선택사항)"
      className="px-3 py-2 border border-gray-300 rounded-lg text-sm
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
    />
  )
}
