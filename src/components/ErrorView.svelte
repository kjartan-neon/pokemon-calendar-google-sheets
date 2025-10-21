<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let message: string = 'Something went wrong';

  const dispatch = createEventDispatcher<{ retry: void }>();

  function handleRetry() {
    dispatch('retry');
  }
</script>

<div class="error-view">
  <div class="error-icon">⚠️</div>
  <h2>Oops!</h2>
  <p>{message}</p>
  <button class="btn-primary" on:click={handleRetry}>
    Try Again
  </button>
</div>

<style>
  .error-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: var(--spacing-6);
    text-align: center;
  }

  .error-icon {
    font-size: 5rem;
    margin-bottom: var(--spacing-6);
  }

  h2 {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-error-700);
    margin: 0 0 var(--spacing-4) 0;
  }

  p {
    font-size: var(--font-size-xl);
    color: var(--color-neutral-700);
    margin: 0 0 var(--spacing-8) 0;
    max-width: 500px;
  }
</style>
