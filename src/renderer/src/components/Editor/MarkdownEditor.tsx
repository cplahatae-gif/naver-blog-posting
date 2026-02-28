import CodeMirror from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'

interface Props {
  value: string
  onChange: (value: string) => void
  fontSize?: number
}

export default function MarkdownEditor({ value, onChange, fontSize = 14 }: Props) {
  return (
    <div className="h-full overflow-hidden">
      <CodeMirror
        value={value}
        height="100%"
        extensions={[
          markdown({ base: markdownLanguage, codeLanguages: languages })
        ]}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          autocompletion: false
        }}
        style={{ fontSize: `${fontSize}px`, height: '100%' }}
        placeholder="마크다운을 입력하세요..."
      />
    </div>
  )
}
