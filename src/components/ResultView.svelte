<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PokemonCard } from '../types';

  export let isCorrect: boolean;
  export let correctAnswer: number;
  export let userAnswer: number;
  export let wonCard: PokemonCard | null;

  const dispatch = createEventDispatcher<{ next: void }>();

  function handleNext() {
    dispatch('next');
  }
</script>

<div class="result-view">
  <div class="result-card" class:correct={isCorrect} class:incorrect={!isCorrect}>
    {#if isCorrect}
      <div class="result-icon success">✓</div>
      <h2 class="result-title">Correct!</h2>
      <p class="result-message">
        Great job! The answer was <strong>{correctAnswer}</strong> {correctAnswer === 1 ? 'hit' : 'hits'}!
      </p>
      {#if wonCard}
        <div class="won-cards">
          <h3>You won this card!</h3>
          <div class="cards-grid">
            <div class="mini-card">
              <img src={wonCard.image} alt={wonCard.name} />
              <span class="card-name">{wonCard.name}</span>
            </div>
          </div>
        </div>
      {/if}
    {:else}
      <div class="result-icon error">✗</div>
      <h2 class="result-title">Not quite!</h2>
      <p class="result-message">
        You answered <strong>{userAnswer}</strong>, but the correct answer was <strong>{correctAnswer}</strong>.
      </p>
      <p class="encouragement">Try again with the next question!</p>
    {/if}
  </div>

  <button class="next-btn btn-primary" on:click={handleNext}>
    Next Question
  </button>
</div>

<style>
  .result-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: var(--spacing-6);
    animation: fadeIn var(--transition-normal) ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .result-card {
    background: white;
    border-radius: var(--border-radius-2xl);
    padding: var(--spacing-10);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    text-align: center;
    max-width: 600px;
    width: 100%;
    margin-bottom: var(--spacing-8);
    position: relative;
    overflow: hidden;
  }

  .result-card::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    animation: shimmer 3s infinite;
    pointer-events: none;
  }

  @keyframes shimmer {
    0%, 100% { transform: translate(-25%, -25%); }
    50% { transform: translate(0%, 0%); }
  }

  .result-card.correct {
    border: 4px solid transparent;
    background-image: linear-gradient(white, white), linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
    background-origin: border-box;
    background-clip: padding-box, border-box;
  }

  .result-card.incorrect {
    border: 4px solid transparent;
    background-image: linear-gradient(white, white), linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    background-origin: border-box;
    background-clip: padding-box, border-box;
  }

  .result-icon {
    width: 100px;
    height: 100px;
    border-radius: var(--border-radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-5xl);
    font-weight: var(--font-weight-bold);
    margin: 0 auto var(--spacing-6) auto;
    animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes scaleIn {
    from {
      transform: scale(0);
    }
    to {
      transform: scale(1);
    }
  }

  .result-icon.success {
    background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
    color: white;
    box-shadow: 0 8px 25px rgba(132, 250, 176, 0.4);
  }

  .result-icon.error {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    box-shadow: 0 8px 25px rgba(245, 87, 108, 0.4);
  }

  .result-title {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    margin: 0 0 var(--spacing-4) 0;
    line-height: var(--line-height-tight);
  }

  .result-card.correct .result-title {
    background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .result-card.incorrect .result-title {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .result-message {
    font-size: var(--font-size-xl);
    color: var(--color-neutral-700);
    line-height: var(--line-height-relaxed);
    margin: 0 0 var(--spacing-4) 0;
  }

  .result-message strong {
    color: var(--color-neutral-900);
    font-weight: var(--font-weight-bold);
  }

  .encouragement {
    font-size: var(--font-size-lg);
    color: var(--color-neutral-600);
    font-style: italic;
    margin: 0;
  }

  .won-cards {
    margin-top: var(--spacing-8);
    padding-top: var(--spacing-6);
    border-top: 2px solid var(--color-neutral-200);
  }

  .won-cards h3 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-neutral-800);
    margin: 0 0 var(--spacing-6) 0;
  }

  .cards-grid {
    display: flex;
    gap: var(--spacing-4);
    justify-content: center;
    flex-wrap: wrap;
  }

  .mini-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-2);
    animation: slideIn 0.5s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .mini-card img {
    width: 120px;
    height: auto;
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-md);
    transition: transform var(--transition-normal);
  }

  .mini-card img:hover {
    transform: scale(1.05);
  }

  .mini-card .card-name {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-neutral-700);
    text-align: center;
  }

  .next-btn {
    font-size: var(--font-size-xl);
    padding: var(--spacing-4) var(--spacing-10);
  }

  @media (max-width: 768px) {
    .result-view {
      padding: var(--spacing-4);
    }

    .result-card {
      padding: var(--spacing-6);
    }

    .result-icon {
      width: 80px;
      height: 80px;
      font-size: var(--font-size-4xl);
    }

    .result-title {
      font-size: var(--font-size-3xl);
    }

    .result-message {
      font-size: var(--font-size-lg);
    }

    .mini-card img {
      width: 100px;
    }
  }
</style>
