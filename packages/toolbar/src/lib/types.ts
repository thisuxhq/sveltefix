export type AnnotationIntent = 'fix' | 'change' | 'question' | 'approve'
export type AnnotationSeverity = 'blocking' | 'important' | 'suggestion'
export type AnnotationStatus = 'pending' | 'acknowledged' | 'resolved' | 'dismissed'

export interface BoundingRect {
  x: number
  y: number
  width: number
  height: number
}

export interface SelectedElement {
  element: string        // tag name
  elementPath: string    // CSS selector
  svelteComponents?: string
  boundingRect: BoundingRect
  textContent?: string
}

export interface PendingAnnotation {
  selected: SelectedElement
  comment: string
  intent: AnnotationIntent
  severity: AnnotationSeverity
}

export interface SveltefixConfig {
  /** Port for the sveltefix-mcp HTTP server. Default: 4747 */
  mcpPort?: number
  /** Session ID to group annotations. Auto-generated if omitted. */
  sessionId?: string
  /** Show copy-to-clipboard fallback button. Default: true */
  showCopyFallback?: boolean
  /** Position of the toolbar FAB. Default: 'bottom-right' */
  position?: 'bottom-right' | 'bottom-left'
}
