<script lang="ts">
  import Overlay from './Overlay.svelte'
  import Toolbar from './Toolbar.svelte'
  import AnnotationPanel from './AnnotationPanel.svelte'
  import AnnotationList from './AnnotationList.svelte'
  import { postAnnotation, deleteAnnotation, checkServerHealth } from './client.js'
  import { buildMultiMarkdownOutput, copyToClipboard } from './output.js'
  import type { SveltefixConfig, AnnotationIntent, AnnotationSeverity, PendingAnnotation, SelectedElement, LocalAnnotation } from './types.js'

  let { mcpPort = 4747, sessionId, showCopyFallback = true, position = 'bottom-right' }: SveltefixConfig = $props()

  // state
  let active = $state(false)          // crosshair mode
  let selected = $state<SelectedElement | null>(null)  // element being annotated
  let showList = $state(false)        // annotation list drawer open
  let submitting = $state(false)
  let serverAvailable = $state(false)
  let annotations = $state<LocalAnnotation[]>([])
  let toastMessage = $state('')
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  let sentCount = $derived(annotations.length)

  // panel position — place near the selected element but always in viewport
  let panelStyle = $derived(computePanelStyle(selected))

  function computePanelStyle(sel: SelectedElement | null): string {
    if (!sel) return ''
    const { x, y, width } = sel.boundingRect
    const panelWidth = 340
    const panelHeight = 500
    const margin = 12

    let left = x + width + margin
    let top = y

    // flip left if off-screen right
    if (left + panelWidth > window.innerWidth - margin) {
      left = x - panelWidth - margin
    }

    // keep in viewport vertically
    if (top + panelHeight > window.innerHeight - margin) {
      top = window.innerHeight - panelHeight - margin
    }

    top = Math.max(margin, top)
    left = Math.max(margin, left)

    return `position:fixed;top:${top}px;left:${left}px;z-index:2147483646;max-height:calc(100vh - ${margin * 2}px);overflow-y:auto`
  }

  // check server health on mount and periodically
  async function pollHealth() {
    serverAvailable = await checkServerHealth(mcpPort)
  }

  $effect(() => {
    pollHealth()
    const interval = setInterval(pollHealth, 10_000)
    return () => clearInterval(interval)
  })

  // keyboard shortcuts
  $effect(() => {
    function onKeydown(e: KeyboardEvent) {
      // Shift+A always toggles crosshair mode
      if (e.key === 'A' && e.shiftKey && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        e.preventDefault()
        if (active) {
          deactivate()
        } else {
          enterCrosshair()
        }
      }
      // Escape closes whatever is open
      if (e.key === 'Escape') {
        if (selected) {
          selected = null
        } else if (showList) {
          showList = false
        } else if (active) {
          deactivate()
        }
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  })

  function onFabClick() {
    if (selected) {
      // close annotation panel
      selected = null
    } else if (active) {
      // exit crosshair mode
      deactivate()
    } else if (showList) {
      // close list
      showList = false
    } else if (annotations.length > 0) {
      // show annotation list
      showList = true
    } else {
      // enter crosshair mode
      enterCrosshair()
    }
  }

  function enterCrosshair() {
    active = true
    selected = null
    showList = false
  }

  function deactivate() {
    active = false
    selected = null
  }

  function onElementSelected(el: SelectedElement) {
    selected = el
    active = false // exit crosshair mode while panel is open
  }

  function showToast(msg: string) {
    toastMessage = msg
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (toastMessage = ''), 3000)
  }

  async function onSubmit(comment: string, intent: AnnotationIntent, severity: AnnotationSeverity) {
    if (!selected) return
    submitting = true

    const annotation: PendingAnnotation = { selected, comment, intent, severity }
    const result = await postAnnotation(annotation, { mcpPort, sessionId })

    if (result.ok) {
      annotations = [...annotations, {
        id: result.annotationId!,
        element: selected.element,
        comment,
        intent,
        severity,
      }]
      // First annotation: show watch mode tip
      if (annotations.length === 1) {
        showToast('Sent! Tell Claude Code "watch mode" to auto-receive')
      } else {
        showToast('Sent to Claude Code')
      }
      selected = null
    } else {
      showToast(`Failed: ${result.error}`)
    }

    submitting = false
  }

  async function onCopy(comment: string, intent: AnnotationIntent, severity: AnnotationSeverity) {
    if (!selected) return
    const annotation: PendingAnnotation = { selected, comment, intent, severity }
    const markdown = buildMultiMarkdownOutput([annotation])
    const ok = await copyToClipboard(markdown)
    showToast(ok ? 'Copied to clipboard' : 'Copy failed')
    selected = null
  }

  async function onDeleteAnnotation(id: string) {
    await deleteAnnotation(id, mcpPort)
    annotations = annotations.filter(a => a.id !== id)
    if (annotations.length === 0) showList = false
  }

  function onNewFromList() {
    showList = false
    enterCrosshair()
  }
</script>

<!-- overlay (crosshair + highlight) -->
<Overlay active={active} onselect={onElementSelected} />

<!-- floating action button -->
<Toolbar
  active={active}
  listOpen={showList}
  serverAvailable={serverAvailable}
  annotationCount={sentCount}
  position={position}
  ontoggle={onFabClick}
/>

<!-- annotation list drawer -->
{#if showList}
  <AnnotationList
    {annotations}
    {position}
    ondelete={onDeleteAnnotation}
    onnew={onNewFromList}
    onclose={() => { showList = false }}
  />
{/if}

<!-- annotation panel -->
{#if selected}
  <div data-sveltefix style={panelStyle}>
    <AnnotationPanel
      selected={selected}
      submitting={submitting}
      serverAvailable={serverAvailable}
      showCopyFallback={showCopyFallback}
      onsubmit={onSubmit}
      oncopy={onCopy}
      oncancel={() => { selected = null; active = true }}
    />
  </div>
{/if}

<!-- toast -->
{#if toastMessage}
  <div
    data-sveltefix
    class="sfix-toast"
    style={position === 'bottom-right' ? 'bottom:80px;right:24px' : 'bottom:80px;left:24px'}
    aria-live="polite"
  >
    {toastMessage}
  </div>
{/if}

<style>
  .sfix-toast {
    position: fixed;
    z-index: 2147483647;
    background: #111114;
    border: 1px solid #27272e;
    color: #e8e8ec;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    font-size: 13px;
    padding: 10px 16px;
    border-radius: 10px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.03);
    animation: sfix-fadein 0.15s ease;
  }

  @keyframes sfix-fadein {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>
