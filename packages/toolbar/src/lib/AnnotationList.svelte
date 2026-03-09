<script lang="ts">
  import type { LocalAnnotation, AnnotationIntent, AnnotationSeverity } from './types.js'

  interface Props {
    annotations: LocalAnnotation[]
    position: 'bottom-right' | 'bottom-left'
    ondelete: (id: string) => void
    onnew: () => void
    onclose: () => void
  }

  let { annotations, position, ondelete, onnew, onclose }: Props = $props()

  const intentEmoji: Record<AnnotationIntent, string> = {
    fix: '\u{1F527}',
    change: '\u{270F}\u{FE0F}',
    question: '\u{2753}',
    approve: '\u{2705}',
  }

  const severityColor: Record<AnnotationSeverity, string> = {
    blocking: '#ef4444',
    important: '#f59e0b',
    suggestion: '#818cf8',
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose()
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  data-sveltefix
  class="sfix-list"
  style={position === 'bottom-right' ? 'bottom:80px;right:24px' : 'bottom:80px;left:24px'}
  onkeydown={onKeydown}
>
  <div class="sfix-list-header">
    <span class="sfix-list-title">Annotations</span>
    <span class="sfix-list-count">{annotations.length}</span>
    <button class="sfix-list-close" onclick={onclose} type="button" aria-label="Close list">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>

  {#if annotations.length === 0}
    <p class="sfix-list-empty">No annotations yet</p>
  {:else}
    <div class="sfix-list-items">
      {#each annotations as ann (ann.id)}
        <div class="sfix-list-item">
          <div class="sfix-list-item-top">
            <span class="sfix-list-intent">{intentEmoji[ann.intent]}</span>
            <span class="sfix-list-el">&lt;{ann.element}&gt;</span>
            <span class="sfix-list-sev" style="background:{severityColor[ann.severity]}"></span>
            <button
              class="sfix-list-del"
              onclick={() => ondelete(ann.id)}
              type="button"
              title="Remove annotation"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <p class="sfix-list-comment">{ann.comment}</p>
        </div>
      {/each}
    </div>
  {/if}

  <button class="sfix-list-add" onclick={onnew} type="button">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M12 5v14M5 12h14"/>
    </svg>
    New annotation
  </button>
</div>

<style>
  .sfix-list {
    position: fixed;
    z-index: 2147483646;
    width: 300px;
    max-height: 400px;
    background: #111114;
    border: 1px solid #27272e;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    font-size: 13px;
    color: #e8e8ec;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.03);
    animation: sfix-slidein 0.15s ease;
    overflow: hidden;
  }

  @keyframes sfix-slidein {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .sfix-list-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    border-bottom: 1px solid #1e1e24;
  }

  .sfix-list-title {
    font-weight: 600;
    font-size: 13px;
    flex: 1;
  }

  .sfix-list-count {
    background: #27272e;
    color: #9ca3af;
    font-size: 11px;
    font-weight: 600;
    min-width: 20px;
    height: 20px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
  }

  .sfix-list-close {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sfix-list-close:hover {
    color: #e8e8ec;
    background: #1e1e24;
  }

  .sfix-list-empty {
    margin: 0;
    padding: 20px 14px;
    color: #6b7280;
    text-align: center;
    font-size: 12px;
  }

  .sfix-list-items {
    overflow-y: auto;
    max-height: 280px;
    padding: 6px;
  }

  .sfix-list-item {
    padding: 8px 10px;
    border-radius: 8px;
    transition: background 0.1s;
  }

  .sfix-list-item:hover {
    background: #1a1a1f;
  }

  .sfix-list-item + .sfix-list-item {
    margin-top: 2px;
  }

  .sfix-list-item-top {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .sfix-list-intent {
    font-size: 12px;
    flex-shrink: 0;
  }

  .sfix-list-el {
    font-family: ui-monospace, 'SF Mono', monospace;
    font-size: 11px;
    color: #a78bfa;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sfix-list-sev {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .sfix-list-del {
    background: none;
    border: none;
    color: #4b5563;
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.1s, color 0.1s;
  }

  .sfix-list-item:hover .sfix-list-del {
    opacity: 1;
  }

  .sfix-list-del:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  .sfix-list-comment {
    margin: 4px 0 0;
    font-size: 12px;
    color: #9ca3af;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-left: 22px;
  }

  .sfix-list-add {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 14px;
    background: none;
    border: none;
    border-top: 1px solid #1e1e24;
    color: #818cf8;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
    transition: background 0.1s, color 0.1s;
  }

  .sfix-list-add:hover {
    background: rgba(129, 140, 248, 0.08);
    color: #a5b4fc;
  }
</style>
