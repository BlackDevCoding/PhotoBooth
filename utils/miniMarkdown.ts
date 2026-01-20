const esc = (s: string) => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

export function miniMarkdown(md: string) {
  const lines = md.split(/\r?\n/)
  const out: string[] = []
  let inList = false

  const closeList = () => {
    if (inList) {
      out.push('</ul>')
      inList = false
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) {
      closeList()
      continue
    }
    const m1 = line.match(/^###\s+(.*)/)
    const m2 = line.match(/^##\s+(.*)/)
    const m3 = line.match(/^#\s+(.*)/)
    const ml = line.match(/^-\s+(.*)/)

    if (m3) {
      closeList()
      out.push(`<h2>${inline(esc(m3[1]))}</h2>`) // keep h2 to match page h1
      continue
    }
    if (m2) {
      closeList()
      out.push(`<h3>${inline(esc(m2[1]))}</h3>`) 
      continue
    }
    if (m1) {
      closeList()
      out.push(`<h4>${inline(esc(m1[1]))}</h4>`) 
      continue
    }
    if (ml) {
      if (!inList) {
        out.push('<ul>')
        inList = true
      }
      out.push(`<li>${inline(esc(ml[1]))}</li>`) 
      continue
    }
    closeList()
    out.push(`<p>${inline(esc(line))}</p>`) 
  }
  closeList()
  return out.join('\n')
}

function inline(s: string) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a class="underline" href="$2" rel="noopener noreferrer" target="_blank">$1</a>')
}
