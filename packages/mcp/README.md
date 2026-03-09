# @thisux/sveltefix-mcp

MCP server for [`@thisux/sveltefix`](https://www.npmjs.com/package/@thisux/sveltefix) — connects AI coding agents to visual browser annotations.

## install

```bash
bun add -d @thisux/sveltefix-mcp
```

## start the server

```bash
npx @thisux/sveltefix-mcp server
```

## connect to Claude Code

```bash
npx @thisux/sveltefix-mcp init
```

This prints the config snippet to add to `~/.claude/claude_code_config.json`. Restart Claude Code after.

## hands-free mode

Add this to your project's `CLAUDE.md`:

```md
When I say "watch mode", call sveltefix_watch_annotations in a loop.
For each annotation: acknowledge it, make the fix, then resolve it with a summary.
Continue watching until I say stop.
```

Then annotate in the browser and watch Claude Code work.

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

## CLI commands

```
npx @thisux/sveltefix-mcp server          # start HTTP + MCP server (default port 4747)
npx @thisux/sveltefix-mcp server --port 5000  # custom port
npx @thisux/sveltefix-mcp init             # setup wizard for Claude Code
npx @thisux/sveltefix-mcp doctor           # check setup and connectivity
```

## license

MIT
