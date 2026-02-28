interface Props {
  value: string
  onChange: (value: string) => void
}

export default function TitleInput({ value, onChange }: Props) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="포스트 제목을 입력하세요"
      className="w-full px-3 py-2 text-lg font-semibold border border-gray-300 rounded-lg
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
        placeholder:text-gray-400"
    />
  )
}
