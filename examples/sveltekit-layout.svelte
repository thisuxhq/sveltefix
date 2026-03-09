<!--
  Example: src/routes/+layout.svelte
  Drop this into any SvelteKit project.
-->
<script lang="ts">
  import { Sveltefix } from 'sveltefix'
</script>

<slot />

<!-- Only render in dev mode — zero impact on production builds -->
{#if import.meta.env.DEV}
  <Sveltefix
    mcpPort={4747}
    showCopyFallback={true}
    position="bottom-right"
  />
{/if}
