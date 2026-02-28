import { Marked, Renderer } from 'marked'

// 네이버 스마트에디터 호환 HTML을 생성하는 커스텀 렌더러
const naverRenderer: Partial<Renderer> = {
  heading({ text, depth }) {
    const fontSizeMap: Record<number, number> = {
      1: 32,
      2: 26,
      3: 22,
      4: 18,
      5: 16,
      6: 14
    }
    const fontSize = fontSizeMap[depth] || 14
    return `<div class="se-module se-module-text">
  <p class="se-text-paragraph" style="line-height:1.8;">
    <span style="font-size:${fontSize}px;"><b>${text}</b></span>
  </p>
</div>\n`
  },

  paragraph({ text }) {
    return `<div class="se-module se-module-text">
  <p class="se-text-paragraph" style="line-height:1.8;">
    <span style="font-size:16px;">${text}</span>
  </p>
</div>\n`
  },

  strong({ text }) {
    return `<b>${text}</b>`
  },

  em({ text }) {
    return `<i>${text}</i>`
  },

  codespan({ text }) {
    return `<code style="background-color:#f5f5f5; padding:2px 6px; border-radius:3px; font-family:monospace;">${text}</code>`
  },

  code({ text, lang }) {
    const language = lang || ''
    return `<div class="se-module se-module-code">
  <pre style="background-color:#1e1e1e; color:#d4d4d4; padding:16px; border-radius:8px; overflow-x:auto; font-family:monospace; font-size:14px; line-height:1.6;">
    <code class="language-${language}">${text}</code>
  </pre>
</div>\n`
  },

  blockquote({ text }) {
    return `<div class="se-module se-module-text se-quote">
  <blockquote style="border-left:4px solid #c7c7c7; padding:8px 16px; margin:8px 0; color:#666;">
    ${text}
  </blockquote>
</div>\n`
  },

  list({ items, ordered }) {
    const tag = ordered ? 'ol' : 'ul'
    const listItems = items.map((item) => `<li>${item.text}</li>`).join('\n')
    return `<div class="se-module se-module-text">
  <${tag} style="padding-left:24px; line-height:1.8;">
    ${listItems}
  </${tag}>
</div>\n`
  },

  listitem({ text }) {
    return `<li style="line-height:1.8;"><span style="font-size:16px;">${text}</span></li>\n`
  },

  image({ href, title, text }) {
    const alt = text || ''
    const titleAttr = title ? ` title="${title}"` : ''
    return `<div class="se-module se-module-image" style="text-align:center; margin:16px 0;">
  <img src="${href}" alt="${alt}"${titleAttr} style="max-width:100%;" />
</div>\n`
  },

  hr() {
    return `<div class="se-module se-module-horizontalLine" style="margin:24px 0;">
  <hr style="border:none; border-top:1px solid #e0e0e0;" />
</div>\n`
  },

  link({ href, title, text }) {
    const titleAttr = title ? ` title="${title}"` : ''
    return `<a href="${href}"${titleAttr} style="color:#009f87; text-decoration:underline;" target="_blank">${text}</a>`
  },

  table({ header, rows }) {
    const headerHtml = header
      .map(
        (cell) =>
          `<th style="border:1px solid #e0e0e0; padding:8px 12px; background-color:#f5f5f5; font-weight:bold;">${cell.text}</th>`
      )
      .join('')
    const rowsHtml = rows
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td style="border:1px solid #e0e0e0; padding:8px 12px;">${cell.text}</td>`).join('')}</tr>`
      )
      .join('\n')
    return `<div class="se-module se-module-table" style="margin:16px 0;">
  <table style="border-collapse:collapse; width:100%;">
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</div>\n`
  }
}

const marked = new Marked({ renderer: naverRenderer })

export function convertMarkdown(markdown: string): string {
  return marked.parse(markdown) as string
}
