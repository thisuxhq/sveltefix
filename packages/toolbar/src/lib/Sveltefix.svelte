<script lang="ts">
  import Overlay from './Overlay.svelte'
  import Toolbar from './Toolbar.svelte'
  import AnnotationPanel from './AnnotationPanel.svelte'
  import { postAnnotation, checkServerHealth } from './client.js'
  import { buildMultiMarkdownOutput, copyToClipboard } from './output.js'
  import type { SveltefixConfig, AnnotationIntent, AnnotationSeverity, PendingAnnotation, SelectedElement } from './types.js'

  let { mcpPort = 4747, sessionId, showCopyFallback = true, position = 'bottom-right' }: SveltefixConfig = $props()

  // state
  let active = $state(false)
  let selected = $state<SelectedElement | null>(null)
  let submitting = $state(false)
  let serverAvailable = $state(false)
  let sentCount = $state(0)
  let toastMessage = $state('')
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  // panel position — place near the selected element but always in viewport
  let panelStyle = $derived(computePanelStyle(selected))

  function computePanelStyle(sel: SelectedElement | null): string {
    if (!sel) return ''
    const { x, y, width, height } = sel.boundingRect
    const panelWidth = 320
    const panelHeight = 280
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

    return `position:fixed;top:${top}px;left:${left}px;z-index:2147483646`
  }

  // check server health on mount and when active changes
  async function pollHealth() {
    serverAvailable = await checkServerHealth(mcpPort)
  }

  $effect(() => {
    pollHealth()
    const interval = setInterval(pollHealth, 10_000)
    return () => clearInterval(interval)
  })

  // keyboard shortcut: shift+A toggles
  $effect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'A' && e.shiftKey && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        toggleActive()
      }
      if (e.key === 'Escape' && active) {
        deactivate()
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  })

  function toggleActive() {
    if (active) {
      deactivate()
    } else {
      active = true
      selected = null
    }
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
      sentCount++
      showToast('✓ Sent to Claude Code')
      selected = null
    } else {
      showToast(`✗ ${result.error}`)
    }

    submitting = false
  }

  async function onCopy(comment: string, intent: AnnotationIntent, severity: AnnotationSeverity) {
    if (!selected) return
    const annotation: PendingAnnotation = { selected, comment, intent, severity }
    const markdown = buildMultiMarkdownOutput([annotation])
    const ok = await copyToClipboard(markdown)
    showToast(ok ? '📋 Copied to clipboard' : '✗ Copy failed')
    selected = null
  }
</script>

<!-- overlay (crosshair + highlight) -->
<Overlay active={active} onselect={onElementSelected} />

<!-- floating action button -->
<Toolbar
  active={active}
  serverAvailable={serverAvailable}
  annotationCount={sentCount}
  position={position}
  ontoggle={toggleActive}
/>

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
    background: #0f0f11;
    border: 1px solid #2a2a30;
    color: #e8e8ec;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 13px;
    padding: 8px 14px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    animation: sfix-fadein 0.15s ease;
  }

  @keyframes sfix-fadein {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>
