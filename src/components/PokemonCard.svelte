<script lang="ts">
  import type { PokemonCard } from '../types';

  export let card: PokemonCard;
  export let showAttacks: boolean = false;
  export let highlightedAttack: string | null = null;
  export let showRarity: boolean = false;
</script>

<div class="pokemon-card">
  <div class="card-image">
    <img src={card.image} alt={card.name} />
  </div>
  <div class="card-info">
    <h3 class="card-name">{card.name}</h3>
    {#if showRarity && card.rarity}
      <div class="card-rarity">
        <span class="rarity-badge">{card.rarity}</span>
      </div>
    {/if}
    {#if showAttacks && card.attacks && card.attacks.length > 0}
      <div class="card-attacks">
        <h4>Attacks:</h4>
        {#each card.attacks as attack}
          <div class="attack" class:highlighted={highlightedAttack === attack.name}>
            <span class="attack-name">{attack.name}</span>
            {#if attack.damage}
              <span class="attack-damage">{attack.damage}</span>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .pokemon-card {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
    backdrop-filter: blur(10px);
    border-radius: var(--border-radius-xl);
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    transition: all var(--transition-normal);
    max-width: 300px;
    width: 100%;
    border: 2px solid rgba(255, 255, 255, 0.5);
  }

  .pokemon-card:hover {
    transform: translateY(-8px) rotate(-2deg);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .card-image {
    width: 100%;
    aspect-ratio: 5/7;
    overflow: hidden;
    background: var(--color-neutral-100);
  }

  .card-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .card-info {
    padding: var(--spacing-4);
  }

  .card-name {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-neutral-900);
    margin: 0 0 var(--spacing-3) 0;
    line-height: var(--line-height-tight);
  }

  .card-rarity {
    margin-bottom: var(--spacing-3);
  }

  .rarity-badge {
    display: inline-block;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--border-radius-full);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 8px rgba(245, 87, 108, 0.3);
  }

  .card-hp {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    margin-bottom: var(--spacing-3);
  }

  .hp-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-error-600);
  }

  .hp-value {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-error-600);
  }

  .card-types {
    display: flex;
    gap: var(--spacing-2);
    flex-wrap: wrap;
    margin-bottom: var(--spacing-3);
  }

  .type-badge {
    background: var(--color-neutral-200);
    color: var(--color-neutral-700);
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--border-radius-full);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }

  .card-attacks {
    margin-top: var(--spacing-4);
  }

  .card-attacks h4 {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-neutral-700);
    margin: 0 0 var(--spacing-2) 0;
  }

  .attack {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-2);
    border-radius: var(--border-radius-md);
    margin-bottom: var(--spacing-2);
    transition: background-color var(--transition-fast);
  }

  .attack.highlighted {
    background: var(--color-primary-100);
    border: 2px solid var(--color-primary-500);
  }

  .attack-name {
    font-size: var(--font-size-sm);
    color: var(--color-neutral-800);
    font-weight: var(--font-weight-medium);
  }

  .attack-damage {
    font-size: var(--font-size-base);
    color: var(--color-error-600);
    font-weight: var(--font-weight-bold);
  }

  @media (max-width: 768px) {
    .pokemon-card {
      max-width: 100%;
    }

    .card-name {
      font-size: var(--font-size-lg);
    }
  }
</style>
