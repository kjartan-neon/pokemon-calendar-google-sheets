<script lang="ts">
  export let message: string = 'Loading...';
</script>

<div class="loading-view">
  <div class="spinner"></div>
  <p>{message}</p>
</div>

<style>
  .loading-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: var(--spacing-6);
  }

  .spinner {
    width: 60px;
    height: 60px;
    border: 4px solid var(--color-neutral-200);
    border-top-color: var(--color-primary-600);
    border-radius: var(--border-radius-full);
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  p {
    margin-top: var(--spacing-6);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-medium);
    color: var(--color-neutral-700);
  }
</style>
