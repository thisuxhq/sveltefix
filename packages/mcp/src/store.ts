import { nanoid } from 'nanoid'
import type {
  Annotation,
  AnnotationStatus,
  CreateAnnotationInput,
  Session,
  SessionWithAnnotations,
  ThreadMessage,
} from './types.js'

// Listeners waiting for new annotations (used by watch tool)
type WatchListener = (annotations: Annotation[]) => void

class AnnotationStore {
  private sessions = new Map<string, Session>()
  private annotations = new Map<string, Annotation>()
  private watchListeners: WatchListener[] = []
  private pendingBatch: Annotation[] = []
  private batchTimer: NodeJS.Timeout | null = null

  // ── Sessions ──────────────────────────────────────────────────────────────

  createSession(url?: string): Session {
    const session: Session = {
      id: nanoid(),
      url,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    this.sessions.set(session.id, session)
    return session
  }

  getSession(id: string): Session | undefined {
    return this.sessions.get(id)
  }

  getOrCreateSession(id?: string, url?: string): Session {
    if (id) {
      const existing = this.sessions.get(id)
      if (existing) return existing
    }
    return this.createSession(url)
  }

  listSessions(): Session[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt)
  }

  getSessionWithAnnotations(id: string): SessionWithAnnotations | undefined {
    const session = this.sessions.get(id)
    if (!session) return undefined
    const annotations = this.getAnnotationsForSession(id)
    return { ...session, annotations }
  }

  updateSessionStatus(id: string, status: Session['status']): boolean {
    const session = this.sessions.get(id)
    if (!session) return false
    session.status = status
    session.updatedAt = Date.now()
    return true
  }

  // ── Annotations ───────────────────────────────────────────────────────────

  addAnnotation(input: CreateAnnotationInput): Annotation {
    const session = this.getOrCreateSession(input.sessionId, input.url)

    const annotation: Annotation = {
      id: nanoid(),
      sessionId: session.id,
      comment: input.comment,
      element: input.element,
      elementPath: input.elementPath,
      svelteComponents: input.svelteComponents,
      boundingRect: input.boundingRect,
      intent: input.intent,
      severity: input.severity,
      status: 'pending',
      createdAt: Date.now(),
      replies: [],
    }

    this.annotations.set(annotation.id, annotation)

    // update session timestamp
    session.updatedAt = Date.now()

    // notify watch listeners
    this.notifyWatchers(annotation)

    return annotation
  }

  getAnnotation(id: string): Annotation | undefined {
    return this.annotations.get(id)
  }

  getAnnotationsForSession(sessionId: string): Annotation[] {
    return Array.from(this.annotations.values())
      .filter((a) => a.sessionId === sessionId)
      .sort((a, b) => a.createdAt - b.createdAt)
  }

  getPendingForSession(sessionId: string): Annotation[] {
    return this.getAnnotationsForSession(sessionId).filter((a) => a.status === 'pending')
  }

  getAllPending(): Annotation[] {
    return Array.from(this.annotations.values())
      .filter((a) => a.status === 'pending')
      .sort((a, b) => a.createdAt - b.createdAt)
  }

  deleteAnnotation(id: string): boolean {
    return this.annotations.delete(id)
  }

  updateStatus(id: string, status: AnnotationStatus, meta?: { summary?: string; reason?: string }): boolean {
    const annotation = this.annotations.get(id)
    if (!annotation) return false
    annotation.status = status
    if (status === 'resolved') {
      annotation.resolvedAt = Date.now()
      annotation.resolveSummary = meta?.summary
    }
    if (status === 'dismissed') {
      annotation.dismissReason = meta?.reason
    }
    return true
  }

  addReply(annotationId: string, author: 'human' | 'agent', message: string): ThreadMessage | undefined {
    const annotation = this.annotations.get(annotationId)
    if (!annotation) return undefined
    const reply: ThreadMessage = {
      id: nanoid(),
      author,
      message,
      createdAt: Date.now(),
    }
    annotation.replies.push(reply)
    return reply
  }

  // ── Watch (long-poll for agents) ──────────────────────────────────────────

  private notifyWatchers(annotation: Annotation) {
    this.pendingBatch.push(annotation)

    // debounce: collect annotations for a short window, then fire
    if (this.batchTimer) clearTimeout(this.batchTimer)
    this.batchTimer = setTimeout(() => {
      const batch = [...this.pendingBatch]
      this.pendingBatch = []
      this.batchTimer = null
      const listeners = [...this.watchListeners]
      this.watchListeners = []
      for (const listener of listeners) {
        listener(batch)
      }
    }, 200)
  }

  waitForAnnotations(
    timeoutMs = 120_000,
    sessionId?: string,
  ): Promise<Annotation[]> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.watchListeners = this.watchListeners.filter((l) => l !== listener)
        resolve([])
      }, timeoutMs)

      const listener: WatchListener = (annotations) => {
        clearTimeout(timer)
        const filtered = sessionId
          ? annotations.filter((a) => a.sessionId === sessionId)
          : annotations
        resolve(filtered)
      }

      this.watchListeners.push(listener)
    })
  }
}

// singleton
export const store = new AnnotationStore()
