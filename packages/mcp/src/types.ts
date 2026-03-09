// Annotation intent — what kind of feedback is this?
export type AnnotationIntent = 'fix' | 'change' | 'question' | 'approve'

// Annotation severity — how urgent is it?
export type AnnotationSeverity = 'blocking' | 'important' | 'suggestion'

// Lifecycle status of an annotation
export type AnnotationStatus = 'pending' | 'acknowledged' | 'resolved' | 'dismissed'

// Session status
export type SessionStatus = 'active' | 'approved' | 'closed'

// A reply in the annotation thread (from agent or human)
export interface ThreadMessage {
  id: string
  author: 'human' | 'agent'
  message: string
  createdAt: number
}

// Core annotation created by the browser toolbar
export interface Annotation {
  id: string
  sessionId: string
  comment: string
  // The tag name of the clicked element e.g. "button"
  element: string
  // Full CSS selector path e.g. "body > main > .hero > button.cta"
  elementPath: string
  // Svelte component chain e.g. "+page.svelte > HeroSection.svelte > Button.svelte"
  svelteComponents?: string
  // Bounding rect of the element at annotation time
  boundingRect?: {
    x: number
    y: number
    width: number
    height: number
  }
  intent: AnnotationIntent
  severity: AnnotationSeverity
  status: AnnotationStatus
  createdAt: number
  resolvedAt?: number
  dismissReason?: string
  resolveSummary?: string
  replies: ThreadMessage[]
}

// Input when creating an annotation from the toolbar
export interface CreateAnnotationInput {
  sessionId?: string // if omitted, a new session is created
  comment: string
  element: string
  elementPath: string
  svelteComponents?: string
  boundingRect?: Annotation['boundingRect']
  intent: AnnotationIntent
  severity: AnnotationSeverity
  url?: string
}

// A session groups annotations for one page/url
export interface Session {
  id: string
  url?: string
  status: SessionStatus
  createdAt: number
  updatedAt: number
}

export interface SessionWithAnnotations extends Session {
  annotations: Annotation[]
}
