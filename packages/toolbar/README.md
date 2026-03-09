# @thisux/sveltefix

Visual annotation toolbar for Svelte/SvelteKit — connects your browser to AI coding agents via MCP.

Click any element in your running app, describe the issue, and Claude Code picks it up automatically.

## install

```bash
bun add -d @thisux/sveltefix
```

## setup

Add the toolbar to your SvelteKit layout:

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

Requires [`@thisux/sveltefix-mcp`](https://www.npmjs.com/package/@thisux/sveltefix-mcp) running to send annotations to Claude Code.

## usage

- **Shift+A** — toggle annotation mode
- **Click any element** — open annotation panel
- **Add comment + intent + severity** — hit "Send to Agent"

## props

```svelte
<Sveltefix
  mcpPort={4747}           <!-- default: 4747 -->
  sessionId="my-session"   <!-- optional: group annotations -->
  showCopyFallback={true}  <!-- show copy button when MCP offline -->
  position="bottom-right"  <!-- bottom-right | bottom-left -->
/>
```

## how it works

In SvelteKit dev mode, Vite attaches component metadata to DOM nodes. `@thisux/sveltefix` reads this and includes the actual `.svelte` file path in every annotation:

```
svelteComponents: "src/routes/+page.svelte > src/lib/HeroSection.svelte > src/lib/ui/Button.svelte"
```

Claude Code opens the file directly — no grep needed.

## license

MIT
