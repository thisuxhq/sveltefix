<script lang="ts">
  import { buildSelectedElement } from './selector.js'
  import type { SelectedElement } from './types.js'

  interface Props {
    active: boolean
    onselect: (el: SelectedElement) => void
  }

  let { active, onselect }: Props = $props()

  let highlightStyle = $state('')
  let hoveredEl = $state<Element | null>(null)

  function isToolbarElement(el: Element): boolean {
    return !!el.closest('[data-sveltefix]')
  }

  function updateHighlight(el: Element) {
    const rect = el.getBoundingClientRect()
    highlightStyle = [
      `top:${rect.top + window.scrollY}px`,
      `left:${rect.left + window.scrollX}px`,
      `width:${rect.width}px`,
      `height:${rect.height}px`,
    ].join(';')
  }

  function onMouseOver(e: MouseEvent) {
    if (!active) return
    const target = e.target as Element
    if (isToolbarElement(target)) return
    hoveredEl = target
    updateHighlight(target)
    e.stopPropagation()
  }

  function onMouseOut() {
    if (!active) return
    hoveredEl = null
    highlightStyle = ''
  }

  function onClick(e: MouseEvent) {
    if (!active) return
    const target = e.target as Element
    if (isToolbarElement(target)) return
    e.preventDefault()
    e.stopPropagation()
    const selected = buildSelectedElement(target)
    onselect(selected)
  }

  $effect(() => {
    if (active) {
      document.addEventListener('mouseover', onMouseOver, true)
      document.addEventListener('mouseout', onMouseOut, true)
      document.addEventListener('click', onClick, true)
      document.body.style.cursor = 'crosshair'
    } else {
      document.removeEventListener('mouseover', onMouseOver, true)
      document.removeEventListener('mouseout', onMouseOut, true)
      document.removeEventListener('click', onClick, true)
      document.body.style.cursor = ''
    }

    return () => {
      document.removeEventListener('mouseover', onMouseOver, true)
      document.removeEventListener('mouseout', onMouseOut, true)
      document.removeEventListener('click', onClick, true)
      document.body.style.cursor = ''
    }
  })
</script>

{#if active && hoveredEl && highlightStyle}
  <div
    data-sveltefix
    class="sfix-highlight"
    style={highlightStyle}
    aria-hidden="true"
  ></div>
{/if}

<style>
  .sfix-highlight {
    position: absolute;
    pointer-events: none;
    outline: 2px solid #818cf8;
    outline-offset: 2px;
    background: rgba(129, 140, 248, 0.06);
    border-radius: 4px;
    z-index: 2147483640;
    transition: top 50ms ease, left 50ms ease, width 50ms ease, height 50ms ease;
  }
</style>
