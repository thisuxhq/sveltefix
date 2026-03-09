<!--
  Example: src/routes/+layout.svelte
  Drop this into any SvelteKit project.
-->
<script lang="ts">
  import { Sveltefix } from '@thisux/sveltefix'
  import { dev } from '$app/environment'
</script>

<slot />

<!-- Only render in dev mode — zero impact on production builds -->
{#if dev}
  <Sveltefix
    mcpPort={4747}
    showCopyFallback={true}
    position="bottom-right"
  />
{/if}
