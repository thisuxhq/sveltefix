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

  const intents: { value: AnnotationIntent; label: string; emoji: string }[] = [
    { value: 'fix', label: 'Fix', emoji: '🔧' },
    { value: 'change', label: 'Change', emoji: '✏️' },
    { value: 'question', label: 'Question', emoji: '❓' },
    { value: 'approve', label: 'Approve', emoji: '✅' },
  ]

  const severities: { value: AnnotationSeverity; label: string; color: string }[] = [
    { value: 'blocking', label: 'Blocking', color: '#ef4444' },
    { value: 'important', label: 'Important', color: '#f59e0b' },
    { value: 'suggestion', label: 'Suggestion', color: '#6366f1' },
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
  <!-- selected element info -->
  <div class="sfix-element-info">
    <span class="sfix-tag">{selected.element}</span>
    <span class="sfix-path">{selected.elementPath}</span>
    {#if selected.svelteComponents}
      <span class="sfix-components">⚡ {selected.svelteComponents}</span>
    {/if}
  </div>

  <!-- intent -->
  <div class="sfix-row">
    {#each intents as i}
      <button
        class="sfix-chip"
        class:sfix-chip--active={intent === i.value}
        onclick={() => (intent = i.value)}
        type="button"
      >
        {i.emoji} {i.label}
      </button>
    {/each}
  </div>

  <!-- severity -->
  <div class="sfix-row">
    {#each severities as s}
      <button
        class="sfix-chip sfix-chip--severity"
        class:sfix-chip--active={severity === s.value}
        style="--color: {s.color}"
        onclick={() => (severity = s.value)}
        type="button"
      >
        {s.label}
      </button>
    {/each}
  </div>

  <!-- comment -->
  <!-- svelte-ignore a11y_autofocus -->
  <textarea
    class="sfix-textarea"
    placeholder="Describe the issue or change..."
    bind:value={comment}
    autofocus
    rows={3}
  ></textarea>

  <!-- actions -->
  <div class="sfix-actions">
    <button class="sfix-btn sfix-btn--ghost" onclick={oncancel} type="button">
      Cancel
    </button>
    {#if showCopyFallback && !serverAvailable}
      <button
        class="sfix-btn sfix-btn--secondary"
        onclick={handleCopy}
        disabled={!comment.trim()}
        type="button"
        title="Copy markdown to clipboard (MCP server not running)"
      >
        📋 Copy
      </button>
    {/if}
    <button
      class="sfix-btn sfix-btn--primary"
      onclick={handleSubmit}
      disabled={!comment.trim() || submitting || !serverAvailable}
      type="button"
      title={serverAvailable ? 'Send to Claude Code (⌘Enter)' : 'MCP server not running'}
    >
      {submitting ? 'Sending…' : '→ Send to Agent'}
    </button>
  </div>

  {#if !serverAvailable}
    <p class="sfix-hint">
      MCP server offline — run <code>npx sveltefix-mcp server</code>
    </p>
  {/if}
</div>

<style>
  .sfix-panel {
    background: #0f0f11;
    border: 1px solid #2a2a30;
    border-radius: 10px;
    padding: 14px;
    width: 320px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 13px;
    color: #e8e8ec;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }

  .sfix-element-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 8px 10px;
    background: #1a1a1f;
    border-radius: 6px;
    font-family: ui-monospace, monospace;
    font-size: 11px;
  }

  .sfix-tag {
    color: #a78bfa;
    font-weight: 600;
  }

  .sfix-path {
    color: #9ca3af;
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

  .sfix-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .sfix-chip {
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid #2a2a30;
    background: transparent;
    color: #9ca3af;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.15s;
  }

  .sfix-chip:hover {
    border-color: #6366f1;
    color: #e8e8ec;
  }

  .sfix-chip--active {
    background: #6366f1;
    border-color: #6366f1;
    color: #fff;
  }

  .sfix-chip--severity.sfix-chip--active {
    background: var(--color);
    border-color: var(--color);
  }

  .sfix-chip--severity:hover {
    border-color: var(--color);
  }

  .sfix-textarea {
    background: #1a1a1f;
    border: 1px solid #2a2a30;
    border-radius: 6px;
    color: #e8e8ec;
    font-size: 13px;
    font-family: inherit;
    padding: 8px 10px;
    resize: vertical;
    min-height: 72px;
    outline: none;
    width: 100%;
    box-sizing: border-box;
  }

  .sfix-textarea:focus {
    border-color: #6366f1;
  }

  .sfix-actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
    align-items: center;
  }

  .sfix-btn {
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s;
  }

  .sfix-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .sfix-btn--ghost {
    background: transparent;
    border-color: #2a2a30;
    color: #6b7280;
  }

  .sfix-btn--ghost:hover:not(:disabled) {
    color: #e8e8ec;
  }

  .sfix-btn--secondary {
    background: #1a1a1f;
    border-color: #2a2a30;
    color: #e8e8ec;
  }

  .sfix-btn--secondary:hover:not(:disabled) {
    border-color: #6366f1;
  }

  .sfix-btn--primary {
    background: #6366f1;
    border-color: #6366f1;
    color: #fff;
  }

  .sfix-btn--primary:hover:not(:disabled) {
    background: #5254cc;
  }

  .sfix-hint {
    margin: 0;
    font-size: 11px;
    color: #6b7280;
    text-align: center;
  }

  .sfix-hint code {
    font-family: ui-monospace, monospace;
    color: #f59e0b;
  }
</style>
