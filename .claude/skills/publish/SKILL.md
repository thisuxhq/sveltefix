---
name: publish
description: Build, bump versions, publish both packages to npm, commit and push
disable-model-invocation: true
argument-hint: [toolbar|mcp|all]
allowed-tools: Read, Edit, Bash
---

# Publish packages to npm

Current versions: !`cd /Users/sanju/thisux/1-work/products/svelte-agentation && node -e "const t=require('./packages/toolbar/package.json');const m=require('./packages/mcp/package.json');console.log('toolbar: '+t.version+', mcp: '+m.version)"`

Publish target: `$ARGUMENTS` (default: `all` if empty)

## Steps

1. **Build both packages**: `bun run build` (always build both even if publishing one — toolbar is a dependency)
2. **Determine which packages to publish** based on `$ARGUMENTS`:
   - `toolbar` — only `@thisux/sveltefix`
   - `mcp` — only `@thisux/sveltefix-mcp`
   - `all` or empty — both packages
3. **Bump patch version** for each package being published (edit `version` in its `package.json`)
4. **Publish each package**: `cd packages/<pkg> && bun publish --access public`
5. **Commit** all changed files with message: `Publish @thisux/sveltefix@X.Y.Z / @thisux/sveltefix-mcp@X.Y.Z`
6. **Push** to remote: `git push`
7. Report the published versions

## Rules

- Always use **bun** — never npm/pnpm/yarn
- Always bump the **patch** version (e.g. 0.1.5 → 0.1.6) unless the user specifies otherwise
- If publish fails with "cannot publish over previously published version", bump again and retry
- Always commit AND push after publishing
