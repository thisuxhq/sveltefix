#!/usr/bin/env node

import { serve } from '@hono/node-server'
import { createHttpServer } from '../server.js'
import { startMcpServer } from '../mcp.js'

const args = process.argv.slice(2)
const command = args[0]

const PORT = parseInt(process.env.PORT ?? '4747', 10)
const MCP_ONLY = args.includes('--mcp-only')

function printHelp() {
  console.error(`
sveltefix-mcp — MCP server for sveltefix

COMMANDS
  server    Start HTTP + MCP server (default)
  init      Setup wizard for Claude Code
  doctor    Check setup and connectivity
  help      Show this help

OPTIONS
  --port <port>    HTTP server port (default: 4747)
  --mcp-only       Skip HTTP server, run MCP on stdio only

EXAMPLES
  npx sveltefix-mcp server
  npx sveltefix-mcp server --port 5000
  npx sveltefix-mcp init
`)
}

async function runServer() {
  const port = args.includes('--port')
    ? parseInt(args[args.indexOf('--port') + 1], 10)
    : PORT

  if (!MCP_ONLY) {
    const app = createHttpServer()
    serve({ fetch: app.fetch, port }, () => {
      console.error(`[sveltefix-mcp] HTTP server listening on http://localhost:${port}`)
    })
  }

  // MCP runs on stdio — connect after HTTP so logs don't pollute stdio
  await startMcpServer()
}

async function runInit() {
  console.error('[sveltefix-mcp] Setup wizard\n')
  console.error('Add to your Claude Code config (~/.claude/claude_code_config.json):')
  console.error('')
  console.error(JSON.stringify({
    mcpServers: {
      'sveltefix': {
        command: 'npx',
        args: ['sveltefix-mcp', 'server'],
      },
    },
  }, null, 2))
  console.error('')
  console.error('Or run: npx add-mcp "npx sveltefix-mcp server"')
  console.error('')
  console.error('Then restart Claude Code.')
}

async function runDoctor() {
  console.error('[sveltefix-mcp] Doctor\n')

  // check node version
  const [major] = process.versions.node.split('.').map(Number)
  const nodeOk = major >= 20
  console.error(`Node.js ${process.versions.node} ${nodeOk ? '✓' : '✗ (requires 20+)'}`)

  // check HTTP server reachability
  const port = PORT
  try {
    const res = await fetch(`http://localhost:${port}/health`)
    const data = await res.json() as { ok: boolean }
    console.error(`HTTP server at :${port} ${data.ok ? '✓ running' : '✗ not responding'}`)
  } catch {
    console.error(`HTTP server at :${port} ✗ not running (start with: npx sveltefix-mcp server)`)
  }
}

switch (command) {
  case 'server':
  case undefined:
    runServer().catch(console.error)
    break
  case 'init':
    runInit().catch(console.error)
    break
  case 'doctor':
    runDoctor().catch(console.error)
    break
  case 'help':
  default:
    printHelp()
    process.exit(0)
}
