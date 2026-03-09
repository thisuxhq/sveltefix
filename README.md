# sveltefix

Visual annotation toolbar for Svelte/SvelteKit — connects your browser to AI coding agents via MCP.

Click any element in your running app, describe the issue, and Claude Code picks it up automatically. No copy-paste. No "the blue button in the sidebar."

Built for SvelteKit + Svelte 5 (runes). Inspired by [agentation.dev](https://agentation.dev) which is React-only.

---

## packages

| Package | Description |
|---|---|
| [`@thisux/sveltefix`](./packages/toolbar) | Svelte 5 toolbar component |
| [`@thisux/sveltefix-mcp`](./packages/mcp) | Local MCP + HTTP server |

---

## quick start

### 1. install

```bash
bun add -d @thisux/sveltefix
bun add -d @thisux/sveltefix-mcp
```

### 2. add the toolbar to your SvelteKit layout

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { Sveltefix } from '@thisux/sveltefix'
  import { dev } from '$app/environment'
</script>

<slot />

{#if dev}
  <Sveltefix />
{/if}
```

### 3. start the MCP server

```bash
npx @thisux/sveltefix-mcp server
```

### 4. connect to Claude Code

```bash
npx @thisux/sveltefix-mcp init
```

This prints the config snippet to add to `~/.claude/claude_code_config.json`. Restart Claude Code after.

---

## usage

- **Shift+A** — toggle annotation mode
- **Click any element** — open annotation panel
- **Add comment + intent + severity** — hit "Send to Agent"
- Claude Code picks it up automatically via `sveltefix_watch_annotations`

### hands-free mode

Add this to your `CLAUDE.md`:

```md
When I say "watch mode", call sveltefix_watch_annotations in a loop.
For each annotation: acknowledge it, make the fix, then resolve it with a summary.
Continue watching until I say stop.
```

Then just annotate in the browser and watch Claude Code work.

---

## component props

```svelte
<Sveltefix
  mcpPort={4747}           <!-- default: 4747 -->
  sessionId="my-session"   <!-- optional: group annotations -->
  showCopyFallback={true}  <!-- show copy button when MCP offline -->
  position="bottom-right"  <!-- bottom-right | bottom-left -->
/>
```

---

## MCP tools

Nine tools exposed to Claude Code:

| Tool | Description |
|---|---|
| `sveltefix_list_sessions` | List all annotation sessions |
| `sveltefix_get_session` | Get session + all annotations |
| `sveltefix_get_pending` | Get pending annotations for session |
| `sveltefix_get_all_pending` | Get all pending across all sessions |
| `sveltefix_acknowledge` | Mark as seen |
| `sveltefix_resolve` | Mark as fixed (with summary) |
| `sveltefix_dismiss` | Dismiss with reason |
| `sveltefix_reply` | Add reply to annotation thread |
| `sveltefix_watch_annotations` | Block until new annotations appear |

---

## svelte-specific advantage

In SvelteKit dev mode, Vite attaches component metadata to DOM nodes. `sveltefix` reads this and includes the actual `.svelte` file path in every annotation:

```
svelteComponents: "src/routes/+page.svelte > src/lib/HeroSection.svelte > src/lib/ui/Button.svelte"
```

Claude Code opens the file directly — no grep needed.

---

## license

MIT
