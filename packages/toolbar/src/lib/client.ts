import type { PendingAnnotation } from './types.js'

export interface ClientConfig {
  mcpPort: number
  sessionId?: string
  url?: string
}

export interface PostResult {
  ok: boolean
  annotationId?: string
  error?: string
}

/**
 * Post an annotation to the local sveltefix-mcp HTTP server.
 * Falls back gracefully if the server isn't running.
 */
export async function postAnnotation(
  annotation: PendingAnnotation,
  config: ClientConfig,
): Promise<PostResult> {
  const endpoint = `http://localhost:${config.mcpPort}/annotations`

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: config.sessionId,
        url: config.url ?? (typeof window !== 'undefined' ? window.location.href : undefined),
        comment: annotation.comment,
        element: annotation.selected.element,
        elementPath: annotation.selected.elementPath,
        svelteComponents: annotation.selected.svelteComponents,
        boundingRect: annotation.selected.boundingRect,
        intent: annotation.intent,
        severity: annotation.severity,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `Server error ${res.status}: ${text}` }
    }

    const data = await res.json() as { annotation: { id: string } }
    return { ok: true, annotationId: data.annotation.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return { ok: false, error: `Could not reach MCP server at :${config.mcpPort} — ${msg}` }
  }
}

/**
 * Check if the MCP server is reachable.
 */
export async function checkServerHealth(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${port}/health`, { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}
