import type { BoundingRect, SelectedElement } from './types.js'

/**
 * Build a unique CSS selector for an element, capped at 4 levels deep.
 * Prefers IDs and data-testid attributes for stability.
 */
export function getSelector(el: Element): string {
  const parts: string[] = []
  let current: Element | null = el

  for (let i = 0; i < 4 && current && current !== document.body; i++) {
    const part = getSelectorPart(current)
    parts.unshift(part)

    // if this part is already unique, stop climbing
    if (document.querySelectorAll(parts.join(' > ')).length === 1) break

    current = current.parentElement
  }

  return parts.join(' > ')
}

function getSelectorPart(el: Element): string {
  // prefer data-testid (most stable for AI greping)
  const testId = el.getAttribute('data-testid')
  if (testId) return `[data-testid="${testId}"]`

  // prefer id
  if (el.id) return `#${el.id}`

  const tag = el.tagName.toLowerCase()

  // collect meaningful class names (skip Tailwind utility noise)
  const classes = Array.from(el.classList)
    .filter((c) => !isTailwindUtility(c) && c.length > 1)
    .slice(0, 3)

  if (classes.length > 0) {
    return `${tag}.${classes.join('.')}`
  }

  // fall back to nth-of-type
  const siblings = el.parentElement
    ? Array.from(el.parentElement.children).filter((c) => c.tagName === el.tagName)
    : []

  if (siblings.length > 1) {
    const index = siblings.indexOf(el) + 1
    return `${tag}:nth-of-type(${index})`
  }

  return tag
}

/**
 * Detect Svelte component info from Vite dev-mode metadata.
 * In SvelteKit dev mode, Vite attaches __svelte_meta to DOM nodes.
 * This gives Claude Code the actual .svelte file path — zero grep needed.
 */
export function getSvelteComponents(el: Element): string | undefined {
  const chain: string[] = []
  let current: Element | null = el

  while (current && current !== document.documentElement) {
    const meta = getSvelteMeta(current)
    if (meta) {
      const name = extractComponentName(meta)
      if (name && !chain.includes(name)) {
        chain.unshift(name)
      }
    }
    current = current.parentElement
  }

  return chain.length > 0 ? chain.join(' > ') : undefined
}

function getSvelteMeta(el: Element): string | undefined {
  // Svelte 5 attaches component info to the element via __svelte internals
  // This is available in dev mode via the element's owner document
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svelteMeta = (el as any).__svelte_meta
    if (svelteMeta?.loc?.file) return svelteMeta.loc.file

    // Svelte 4 fallback via data attribute set by vite plugin
    const attr = el.getAttribute('data-svelte-h') ?? el.getAttribute('data-svelte')
    if (attr) return attr
  } catch {
    // silently ignore — not in dev mode or no meta available
  }
  return undefined
}

function extractComponentName(meta: string): string {
  // meta is typically a file path like /src/lib/components/Button.svelte
  // extract the filename for readability
  const parts = meta.split('/')
  const file = parts[parts.length - 1]
  // return relative path from src/ if possible
  const srcIndex = parts.indexOf('src')
  if (srcIndex !== -1) {
    return parts.slice(srcIndex).join('/')
  }
  return file ?? meta
}

/**
 * Rough heuristic — Tailwind utility classes are short and follow known patterns.
 * We skip them to keep selectors clean for AI consumption.
 */
function isTailwindUtility(cls: string): boolean {
  return /^(flex|grid|block|inline|hidden|text-|bg-|p-|m-|w-|h-|border|rounded|shadow|font-|leading-|tracking-|gap-|space-|items-|justify-|overflow-|z-|top-|left-|right-|bottom-|absolute|relative|fixed|sticky|sr-only|container|cursor-)/.test(cls)
}

/**
 * Get a clean bounding rect relative to the viewport.
 */
export function getBoundingRect(el: Element): BoundingRect {
  const rect = el.getBoundingClientRect()
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  }
}

/**
 * Build a full SelectedElement from a DOM element.
 */
export function buildSelectedElement(el: Element): SelectedElement {
  return {
    element: el.tagName.toLowerCase(),
    elementPath: getSelector(el),
    svelteComponents: getSvelteComponents(el),
    boundingRect: getBoundingRect(el),
    textContent: el.textContent?.trim().slice(0, 100) || undefined,
  }
}
