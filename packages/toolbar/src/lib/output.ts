import type { PendingAnnotation } from './types.js'

/**
 * Build structured markdown output for pasting into Claude Code.
 * This is the fallback when the MCP server isn't running.
 *
 * Claude Code uses this to grep the codebase for the exact component.
 */
export function buildMarkdownOutput(annotation: PendingAnnotation, index = 1): string {
  const { selected, comment, intent, severity } = annotation

  const lines: string[] = [
    `## Annotation ${index}`,
    '',
    `**Feedback:** ${comment}`,
    `**Intent:** ${intent}`,
    `**Severity:** ${severity}`,
    '',
    '### Element',
    `- **Tag:** \`${selected.element}\``,
    `- **Selector:** \`${selected.elementPath}\``,
  ]

  if (selected.svelteComponents) {
    lines.push(`- **Svelte components:** \`${selected.svelteComponents}\``)
  }

  if (selected.textContent) {
    lines.push(`- **Text content:** "${selected.textContent}"`)
  }

  lines.push(
    `- **Position:** x:${selected.boundingRect.x} y:${selected.boundingRect.y} (${selected.boundingRect.width}×${selected.boundingRect.height}px)`,
  )

  return lines.join('\n')
}

export function buildMultiMarkdownOutput(annotations: PendingAnnotation[]): string {
  return annotations
    .map((a, i) => buildMarkdownOutput(a, i + 1))
    .join('\n\n---\n\n')
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // fallback for older browsers
    try {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      return true
    } catch {
      return false
    }
  }
}
