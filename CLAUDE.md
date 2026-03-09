# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`sveltefix` is a visual annotation toolbar for Svelte/SvelteKit that connects the browser to AI coding agents via MCP. Users click elements in their running app, describe issues, and Claude Code picks them up automatically.

## Monorepo Structure

Bun workspaces monorepo with two packages. Always use `bun` — never pnpm/npm/yarn.

- **`packages/toolbar`** (`sveltefix`) — Svelte 5 component library. Built with `svelte-package`. Exports the `<Sveltefix>` component.
- **`packages/mcp`** (`sveltefix-mcp`) — Node.js MCP + HTTP server. Uses Hono for HTTP, `@modelcontextprotocol/sdk` for MCP over stdio. Has a CLI (`bin/cli.ts`).

## Commands

```bash
# Development (watch mode)
bun dev:toolbar          # svelte-package --watch
bun dev:mcp              # tsc --watch

# Build both packages
bun run build            # builds toolbar first, then mcp

# Type checking
bun --filter sveltefix check       # svelte-check for toolbar
bun --filter sveltefix-mcp typecheck  # tsc --noEmit for mcp

# Lint
bun run lint             # runs lint across all packages

# Run MCP server
bun --filter sveltefix-mcp start   # node dist/bin/cli.js server

# Install dependencies
bun install
```

## Architecture

### Data Flow

```
Browser (Svelte toolbar) → HTTP POST /annotations → MCP server (in-memory store) → MCP stdio → Claude Code
```

1. **Toolbar** (`Sveltefix.svelte`): FAB button activates crosshair mode. `Overlay.svelte` handles element hover/click. `AnnotationPanel.svelte` collects comment/intent/severity.
2. **Client** (`client.ts`): POSTs annotation to `http://localhost:4747/annotations`. Falls back to clipboard copy via `output.ts` if server is offline.
3. **Selector** (`selector.ts`): Builds CSS selectors (prefers `data-testid` > `id` > classes, filters Tailwind utilities). Reads `__svelte_meta` for component file paths in dev mode.
4. **HTTP Server** (`server.ts`): Hono app with CORS. Receives annotations, serves session/pending endpoints.
5. **Store** (`store.ts`): Singleton in-memory `AnnotationStore`. Manages sessions and annotations. Has a `waitForAnnotations()` long-poll with debounced watcher pattern for the watch tool.
6. **MCP Server** (`mcp.ts`): Exposes 9 tools to Claude Code over stdio. Uses the same singleton store as the HTTP server.

### Key Types

- `AnnotationIntent`: `'fix' | 'change' | 'question' | 'approve'`
- `AnnotationSeverity`: `'blocking' | 'important' | 'suggestion'`
- `AnnotationStatus`: `'pending' | 'acknowledged' | 'resolved' | 'dismissed'`

Types are defined independently in both packages (`packages/toolbar/src/lib/types.ts` and `packages/mcp/src/types.ts`) — they are not shared.

### Svelte Conventions

- Svelte 5 with runes (`$state`, `$derived`, `$effect`, `$props`)
- All toolbar DOM elements use `data-sveltefix` attribute to exclude themselves from element selection
- CSS class prefix: `sfix-` (scoped styles within each component)
- All styles are inline `<style>` blocks, dark theme, using max z-index (`2147483647`)

## Watch Mode

When the user says "watch mode" or "start watching":
1. Call `sveltefix_watch_annotations` (blocks until annotations appear)
2. For each annotation returned:
   - Call `sveltefix_acknowledge` immediately (lets user know you saw it)
   - Read the `svelteComponents` field — open that file directly
   - Read the `elementPath` (CSS selector) to locate the element in the file
   - Make the requested change based on `comment`, `intent`, and `severity`
   - Call `sveltefix_resolve` with a brief summary of what you changed
3. Call `sveltefix_watch_annotations` again to keep listening
4. Stop when the user says "stop watching" or after 5 minutes of inactivity

## Annotation Priority

Process in this order:
1. `severity: blocking` first
2. `severity: important` second
3. `severity: suggestion` last

## When to Ask

- `intent: question` — the user is asking, not requesting a change. Use `sveltefix_reply` to answer.
- `intent: approve` — user is happy with the current state. Call `sveltefix_resolve` with "No changes needed — approved."
- Unclear feedback — use `sveltefix_reply` to ask for clarification before making changes.
