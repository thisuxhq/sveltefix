import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { store } from './store.js'

const createAnnotationSchema = z.object({
  sessionId: z.string().optional(),
  comment: z.string().min(1),
  element: z.string(),
  elementPath: z.string(),
  svelteComponents: z.string().optional(),
  boundingRect: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  intent: z.enum(['fix', 'change', 'question', 'approve']),
  severity: z.enum(['blocking', 'important', 'suggestion']),
  url: z.string().optional(),
})

export function createHttpServer() {
  const app = new Hono()

  // allow browser toolbar (localhost) to POST
  app.use(
    '*',
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
    }),
  )

  // health check
  app.get('/health', (c) => c.json({ ok: true, service: 'sveltefix-mcp' }))

  // create annotation from toolbar
  app.post('/annotations', zValidator('json', createAnnotationSchema), async (c) => {
    const input = c.req.valid('json')
    const annotation = store.addAnnotation(input)
    return c.json({ ok: true, annotation }, 201)
  })

  // delete annotation (from toolbar)
  app.delete('/annotations/:id', (c) => {
    const ok = store.deleteAnnotation(c.req.param('id'))
    if (!ok) return c.json({ error: 'not found' }, 404)
    return c.json({ ok: true })
  })

  // list all sessions (used by toolbar to show status)
  app.get('/sessions', (c) => {
    return c.json(store.listSessions())
  })

  // get one session with all annotations
  app.get('/sessions/:id', (c) => {
    const session = store.getSessionWithAnnotations(c.req.param('id'))
    if (!session) return c.json({ error: 'not found' }, 404)
    return c.json(session)
  })

  // get pending annotations for session (toolbar polls this)
  app.get('/sessions/:id/pending', (c) => {
    const session = store.getSession(c.req.param('id'))
    if (!session) return c.json({ error: 'not found' }, 404)
    const pending = store.getPendingForSession(c.req.param('id'))
    return c.json({ count: pending.length, annotations: pending })
  })

  return app
}
