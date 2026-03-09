<script lang="ts">
  import type { AnnotationIntent, AnnotationSeverity, SelectedElement } from './types.js'

  interface Props {
    selected: SelectedElement
    submitting: boolean
    serverAvailable: boolean
    showCopyFallback: boolean
    onsubmit: (comment: string, intent: AnnotationIntent, severity: AnnotationSeverity) => void
    oncopy: (comment: string, intent: AnnotationIntent, severity: AnnotationSeverity) => void
    oncancel: () => void
  }

  let {
    selected,
    submitting,
    serverAvailable,
    showCopyFallback,
    onsubmit,
    oncopy,
    oncancel,
  }: Props = $props()

  let comment = $state('')
  let intent = $state<AnnotationIntent>('fix')
  let severity = $state<AnnotationSeverity>('important')

  const intents: { value: AnnotationIntent; label: string; icon: string }[] = [
    { value: 'fix', label: 'Fix', icon: '\u{1F527}' },
    { value: 'change', label: 'Change', icon: '\u{270F}\u{FE0F}' },
    { value: 'question', label: 'Question', icon: '\u{2753}' },
    { value: 'approve', label: 'Approve', icon: '\u{2705}' },
  ]

  const severities: { value: AnnotationSeverity; label: string; color: string }[] = [
    { value: 'blocking', label: 'Blocking', color: '#ef4444' },
    { value: 'important', label: 'Important', color: '#f59e0b' },
    { value: 'suggestion', label: 'Suggestion', color: '#818cf8' },
  ]

  function handleSubmit() {
    if (!comment.trim()) return
    onsubmit(comment.trim(), intent, severity)
  }

  function handleCopy() {
    if (!comment.trim()) return
    oncopy(comment.trim(), intent, severity)
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
    if (e.key === 'Escape') oncancel()
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  data-sveltefix
  class="sfix-panel"
  onkeydown={onKeydown}
  role="dialog"
  aria-label="Annotate element"
>
  <!-- header -->
  <div class="sfix-panel-header">
    <span class="sfix-panel-title">Annotate</span>
    <button class="sfix-panel-close" onclick={oncancel} type="button" aria-label="Close">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>

  <!-- selected element info -->
  <div class="sfix-element-info">
    <div class="sfix-element-row">
      <span class="sfix-tag">&lt;{selected.element}&gt;</span>
      {#if selected.textContent}
        <span class="sfix-text">"{selected.textContent.slice(0, 40)}{selected.textContent.length > 40 ? '...' : ''}"</span>
      {/if}
    </div>
    <span class="sfix-path">{selected.elementPath}</span>
    {#if selected.svelteComponents}
      <span class="sfix-components">{selected.svelteComponents}</span>
    {/if}
  </div>

  <!-- intent -->
  <div class="sfix-section">
    <span class="sfix-label">Type</span>
    <div class="sfix-row">
      {#each intents as i}
        <button
          class="sfix-chip"
          class:sfix-chip--active={intent === i.value}
          onclick={() => (intent = i.value)}
          type="button"
        >
          <span class="sfix-chip-icon">{i.icon}</span>
          {i.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- severity -->
  <div class="sfix-section">
    <span class="sfix-label">Priority</span>
    <div class="sfix-row">
      {#each severities as s}
        <button
          class="sfix-chip sfix-chip--severity"
          class:sfix-chip--active={severity === s.value}
          style="--sev-color: {s.color}"
          onclick={() => (severity = s.value)}
          type="button"
        >
          <span class="sfix-sev-dot" style="background:{s.color}"></span>
          {s.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- comment -->
  <!-- svelte-ignore a11y_autofocus -->
  <textarea
    class="sfix-textarea"
    placeholder="Describe what needs to change..."
    bind:value={comment}
    autofocus
    rows={3}
  ></textarea>

  <!-- actions -->
  <div class="sfix-actions">
    {#if showCopyFallback && !serverAvailable}
      <button
        class="sfix-btn sfix-btn--secondary"
        onclick={handleCopy}
        disabled={!comment.trim()}
        type="button"
        title="Copy markdown to clipboard"
      >
        Copy
      </button>
    {/if}
    <div class="sfix-actions-right">
      <button class="sfix-btn sfix-btn--ghost" onclick={oncancel} type="button">
        Cancel
      </button>
      <button
        class="sfix-btn sfix-btn--primary"
        onclick={handleSubmit}
        disabled={!comment.trim() || submitting || !serverAvailable}
        type="button"
        title={serverAvailable ? 'Send to Claude Code (\u2318Enter)' : 'MCP server not running'}
      >
        {#if submitting}
          Sending...
        {:else}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
          Send
        {/if}
      </button>
    </div>
  </div>

  {#if !serverAvailable}
    <p class="sfix-hint">
      MCP server offline — run <code>npx @thisux/sveltefix-mcp server</code>
    </p>
  {/if}
</div>

<style>
  .sfix-panel {
    background: #111114;
    border: 1px solid #27272e;
    border-radius: 12px;
    padding: 0;
    width: 340px;
    display: flex;
    flex-direction: column;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    font-size: 13px;
    color: #e8e8ec;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.03);
    animation: sfix-panelin 0.15s ease;
    overflow: hidden;
  }

  @keyframes sfix-panelin {
    from { opacity: 0; transform: scale(0.97) translateY(4px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .sfix-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid #1e1e24;
  }

  .sfix-panel-title {
    font-weight: 600;
    font-size: 13px;
  }

  .sfix-panel-close {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.1s;
  }

  .sfix-panel-close:hover {
    color: #e8e8ec;
    background: #1e1e24;
  }

  .sfix-element-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 14px;
    margin: 0;
    background: #0c0c0e;
    font-family: ui-monospace, 'SF Mono', monospace;
    font-size: 11px;
    border-bottom: 1px solid #1e1e24;
  }

  .sfix-element-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sfix-tag {
    color: #a78bfa;
    font-weight: 600;
    flex-shrink: 0;
  }

  .sfix-text {
    color: #6b7280;
    font-style: italic;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 10px;
  }

  .sfix-path {
    color: #6b7280;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sfix-components {
    color: #f59e0b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sfix-section {
    padding: 0 14px;
    margin-top: 10px;
  }

  .sfix-label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
  }

  .sfix-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .sfix-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    border-radius: 8px;
    border: 1px solid #27272e;
    background: transparent;
    color: #9ca3af;
    cursor: pointer;
    font-size: 12px;
    font-family: inherit;
    transition: all 0.12s ease;
  }

  .sfix-chip-icon {
    font-size: 11px;
  }

  .sfix-chip:hover {
    border-color: #818cf8;
    color: #e8e8ec;
    background: rgba(129, 140, 248, 0.06);
  }

  .sfix-chip--active {
    background: rgba(129, 140, 248, 0.15);
    border-color: #818cf8;
    color: #c7d2fe;
  }

  .sfix-chip--severity:hover {
    border-color: var(--sev-color);
    background: color-mix(in srgb, var(--sev-color) 6%, transparent);
  }

  .sfix-chip--severity.sfix-chip--active {
    border-color: var(--sev-color);
    background: color-mix(in srgb, var(--sev-color) 15%, transparent);
    color: #e8e8ec;
  }

  .sfix-sev-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .sfix-textarea {
    background: #0c0c0e;
    border: 1px solid #27272e;
    border-radius: 8px;
    color: #e8e8ec;
    font-size: 13px;
    font-family: inherit;
    padding: 10px 12px;
    resize: vertical;
    min-height: 72px;
    outline: none;
    margin: 10px 14px 0;
    width: calc(100% - 28px);
    box-sizing: border-box;
    transition: border-color 0.12s;
  }

  .sfix-textarea::placeholder {
    color: #4b5563;
  }

  .sfix-textarea:focus {
    border-color: #818cf8;
    box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.1);
  }

  .sfix-actions {
    display: flex;
    gap: 6px;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
  }

  .sfix-actions-right {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-left: auto;
  }

  .sfix-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.12s ease;
  }

  .sfix-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .sfix-btn--ghost {
    background: transparent;
    border-color: transparent;
    color: #6b7280;
  }

  .sfix-btn--ghost:hover:not(:disabled) {
    color: #9ca3af;
    background: #1e1e24;
  }

  .sfix-btn--secondary {
    background: #1e1e24;
    border-color: #27272e;
    color: #e8e8ec;
  }

  .sfix-btn--secondary:hover:not(:disabled) {
    border-color: #818cf8;
  }

  .sfix-btn--primary {
    background: #818cf8;
    border-color: #818cf8;
    color: #fff;
  }

  .sfix-btn--primary:hover:not(:disabled) {
    background: #6366f1;
    border-color: #6366f1;
  }

  .sfix-btn--primary:active:not(:disabled) {
    transform: scale(0.98);
  }

  .sfix-hint {
    margin: 0;
    font-size: 11px;
    color: #6b7280;
    text-align: center;
    padding: 0 14px 12px;
  }

  .sfix-hint code {
    font-family: ui-monospace, 'SF Mono', monospace;
    color: #f59e0b;
    font-size: 10px;
  }
</style>
