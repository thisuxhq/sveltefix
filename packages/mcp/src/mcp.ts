import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { store } from './store.js'

function ok(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
}

function err(message: string) {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }], isError: true }
}

export async function startMcpServer() {
  const server = new McpServer({
    name: 'sveltefix',
    version: '0.1.0',
  })

  // ── 1. list sessions ───────────────────────────────────────────────────────
  server.tool(
    'sveltefix_list_sessions',
    'List all active annotation sessions. Use this to discover which pages have feedback.',
    {},
    async () => {
      const sessions = store.listSessions()
      return ok({ count: sessions.length, sessions })
    },
  )

  // ── 2. get session ─────────────────────────────────────────────────────────
  server.tool(
    'sveltefix_get_session',
    'Get a session with all its annotations.',
    { sessionId: z.string().describe('The session ID to retrieve') },
    async ({ sessionId }) => {
      const session = store.getSessionWithAnnotations(sessionId)
      if (!session) return err(`Session ${sessionId} not found`)
      return ok(session)
    },
  )

  // ── 3. get pending for session ─────────────────────────────────────────────
  server.tool(
    'sveltefix_get_pending',
    'Get all pending (unacknowledged) annotations for a session. Use this to see what feedback needs attention.',
    { sessionId: z.string().describe('The session ID to check') },
    async ({ sessionId }) => {
      const session = store.getSession(sessionId)
      if (!session) return err(`Session ${sessionId} not found`)
      const annotations = store.getPendingForSession(sessionId)
      return ok({ count: annotations.length, annotations })
    },
  )

  // ── 4. get all pending ─────────────────────────────────────────────────────
  server.tool(
    'sveltefix_get_all_pending',
    'Get all pending annotations across ALL sessions. Use this to see all unaddressed feedback from the human.',
    {},
    async () => {
      const annotations = store.getAllPending()
      return ok({ count: annotations.length, annotations })
    },
  )

  // ── 5. acknowledge ─────────────────────────────────────────────────────────
  server.tool(
    'sveltefix_acknowledge',
    "Mark an annotation as acknowledged. Use this to let the human know you've seen their feedback and will address it.",
    { annotationId: z.string().describe('The annotation ID to acknowledge') },
    async ({ annotationId }) => {
      const success = store.updateStatus(annotationId, 'acknowledged')
      if (!success) return err(`Annotation ${annotationId} not found`)
      return ok({ ok: true, annotationId, status: 'acknowledged' })
    },
  )

  // ── 6. resolve ─────────────────────────────────────────────────────────────
  server.tool(
    'sveltefix_resolve',
    "Mark an annotation as resolved. Use this after you've addressed the feedback. Include a summary of what you did.",
    {
      annotationId: z.string().describe('The annotation ID to resolve'),
      summary: z.string().optional().describe('Brief description of what you changed'),
    },
    async ({ annotationId, summary }) => {
      const success = store.updateStatus(annotationId, 'resolved', { summary })
      if (!success) return err(`Annotation ${annotationId} not found`)
      return ok({ ok: true, annotationId, status: 'resolved', summary })
    },
  )

  // ── 7. dismiss ─────────────────────────────────────────────────────────────
  server.tool(
    'sveltefix_dismiss',
    "Dismiss an annotation with a reason. Use this when you've decided not to address the feedback.",
    {
      annotationId: z.string().describe('The annotation ID to dismiss'),
      reason: z.string().describe('Why you are dismissing this annotation'),
    },
    async ({ annotationId, reason }) => {
      const success = store.updateStatus(annotationId, 'dismissed', { reason })
      if (!success) return err(`Annotation ${annotationId} not found`)
      return ok({ ok: true, annotationId, status: 'dismissed', reason })
    },
  )

  // ── 8. reply ───────────────────────────────────────────────────────────────
  server.tool(
    'sveltefix_reply',
    "Add a reply to an annotation's thread. Use this to ask clarifying questions or provide updates to the human.",
    {
      annotationId: z.string().describe('The annotation ID to reply to'),
      message: z.string().describe('Your reply message'),
    },
    async ({ annotationId, message }) => {
      const reply = store.addReply(annotationId, 'agent', message)
      if (!reply) return err(`Annotation ${annotationId} not found`)
      return ok({ ok: true, annotationId, reply })
    },
  )

  // ── 9. watch annotations ───────────────────────────────────────────────────
  server.tool(
    'sveltefix_watch_annotations',
    'Block until new annotations appear, then return them. Use in a loop for hands-free mode: annotate in browser, agent picks up automatically.',
    {
      sessionId: z.string().optional().describe('Watch only this session (omit for all sessions)'),
      timeoutSeconds: z
        .number()
        .min(10)
        .max(300)
        .default(120)
        .describe('How long to wait before giving up (default 120s)'),
    },
    async ({ sessionId, timeoutSeconds }) => {
      const annotations = await store.waitForAnnotations(
        (timeoutSeconds ?? 120) * 1000,
        sessionId,
      )
      if (annotations.length === 0) {
        return ok({ timedOut: true, annotations: [] })
      }
      return ok({ timedOut: false, count: annotations.length, annotations })
    },
  )

  const transport = new StdioServerTransport()
  await server.connect(transport)

  return server
}
