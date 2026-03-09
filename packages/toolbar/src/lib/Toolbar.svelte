<script lang="ts">
  interface Props {
    active: boolean
    serverAvailable: boolean
    annotationCount: number
    position: 'bottom-right' | 'bottom-left'
    ontoggle: () => void
  }

  let { active, serverAvailable, annotationCount, position, ontoggle }: Props = $props()

  const positionStyle = $derived(
    position === 'bottom-right'
      ? 'bottom:24px;right:24px'
      : 'bottom:24px;left:24px'
  )
</script>

<button
  data-sveltefix
  class="sfix-fab"
  class:sfix-fab--active={active}
  style={positionStyle}
  onclick={ontoggle}
  type="button"
  title={active ? 'Click element to annotate (Esc to cancel)' : 'Annotate for AI agent'}
  aria-label="Toggle annotation mode"
>
  <!-- icon -->
  {#if active}
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M15 10l-4 4 4 4"/>
      <path d="M20 4H4a2 2 0 00-2 2v14l4-4h14a2 2 0 002-2V6a2 2 0 00-2-2z"/>
    </svg>
  {:else}
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  {/if}

  <!-- annotation count badge -->
  {#if annotationCount > 0}
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
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #0f0f11;
    border: 1.5px solid #2a2a30;
    color: #9ca3af;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    transition: all 0.2s;
  }

  .sfix-fab:hover {
    border-color: #6366f1;
    color: #e8e8ec;
    transform: scale(1.05);
  }

  .sfix-fab--active {
    background: #6366f1;
    border-color: #6366f1;
    color: #fff;
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.5);
  }

  .sfix-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #f59e0b;
    color: #000;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 700;
    min-width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    font-family: ui-sans-serif, sans-serif;
  }

  .sfix-dot {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #374151;
    border: 1.5px solid #0f0f11;
  }

  .sfix-dot--online {
    background: #22c55e;
  }
</style>
