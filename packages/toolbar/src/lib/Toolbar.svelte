<script lang="ts">
  interface Props {
    active: boolean
    listOpen: boolean
    serverAvailable: boolean
    annotationCount: number
    position: 'bottom-right' | 'bottom-left'
    ontoggle: () => void
  }

  let { active, listOpen, serverAvailable, annotationCount, position, ontoggle }: Props = $props()

  const positionStyle = $derived(
    position === 'bottom-right'
      ? 'bottom:24px;right:24px'
      : 'bottom:24px;left:24px'
  )

  const title = $derived(
    active
      ? 'Click element to annotate (Esc to cancel)'
      : listOpen
        ? 'Close annotation list'
        : annotationCount > 0
          ? 'View annotations'
          : 'Annotate for AI agent (Shift+A)'
  )
</script>

<button
  data-sveltefix
  class="sfix-fab"
  class:sfix-fab--active={active}
  class:sfix-fab--list={listOpen && !active}
  style={positionStyle}
  onclick={ontoggle}
  type="button"
  {title}
  aria-label="Toggle annotation mode"
>
  <!-- icon changes based on state -->
  {#if active}
    <!-- crosshair icon -->
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
    </svg>
  {:else if listOpen}
    <!-- close icon -->
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  {:else}
    <!-- chat/annotate icon -->
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  {/if}

  <!-- annotation count badge -->
  {#if annotationCount > 0 && !listOpen}
    <span class="sfix-badge">{annotationCount}</span>
  {/if}

  <!-- server status dot -->
  <span
    class="sfix-dot"
    class:sfix-dot--online={serverAvailable}
    title={serverAvailable ? 'MCP server connected' : 'MCP server offline'}
  ></span>
</button>

<style>
  .sfix-fab {
    position: fixed;
    z-index: 2147483647;
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: #111114;
    border: 1.5px solid #27272e;
    color: #9ca3af;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.03);
    transition: all 0.2s ease;
  }

  .sfix-fab:hover {
    border-color: #818cf8;
    color: #e8e8ec;
    transform: scale(1.05);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(129, 140, 248, 0.2);
  }

  .sfix-fab--active {
    background: #818cf8;
    border-color: #818cf8;
    color: #fff;
    box-shadow: 0 4px 20px rgba(129, 140, 248, 0.4);
    animation: sfix-pulse 2s ease infinite;
  }

  .sfix-fab--active:hover {
    background: #6366f1;
    border-color: #6366f1;
  }

  .sfix-fab--list {
    background: #1e1e24;
    border-color: #818cf8;
    color: #818cf8;
  }

  @keyframes sfix-pulse {
    0%, 100% { box-shadow: 0 4px 20px rgba(129, 140, 248, 0.4); }
    50% { box-shadow: 0 4px 24px rgba(129, 140, 248, 0.6); }
  }

  .sfix-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #f59e0b;
    color: #000;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 700;
    min-width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
    font-family: ui-sans-serif, system-ui, sans-serif;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  }

  .sfix-dot {
    position: absolute;
    bottom: 3px;
    right: 3px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #374151;
    border: 1.5px solid #111114;
  }

  .sfix-dot--online {
    background: #22c55e;
  }
</style>
