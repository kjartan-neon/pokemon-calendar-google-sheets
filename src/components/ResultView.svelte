<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PokemonCard } from '../types';
  import type { Translations } from '../i18n/translations';

  export let isCorrect: boolean;
  export let correctAnswer: number;
  export let userAnswer: number;
  export let wonCard: PokemonCard | null;
  export let t: Translations;
  export let needsStreak: boolean = false;
  export let streakProgress: number = 0;
  export let currentStreak: number = 0;

  const dispatch = createEventDispatcher<{ next: void }>();

  function handleNext() {
    dispatch('next');
  }
</script>

<div class="result-view">
  <div class="result-card" class:correct={isCorrect} class:incorrect={!isCorrect}>
    {#if isCorrect}
      <div class="result-icon success">✓</div>
      <h2 class="result-title">{t.correct}</h2>
      <p class="result-message">
        {t.correctMessage} <strong>{correctAnswer}</strong> {correctAnswer === 1 ? t.hit : t.hits}!
      </p>
      {#if needsStreak && !wonCard}
        <div class="streak-info">
          <p class="streak-text">
            {#if currentStreak === 1}
              {t.language === 'Språk' ? 'One more correct to win this card!' : 'Én til riktig for å vinne dette kortet!'}
            {:else}
              {t.language === 'Språk' ? 'Get 2 correct answers to win this rare card!' : 'Få 2 riktige svar for å vinne dette sjeldne kortet!'}
            {/if}
          </p>
          <div class="streak-progress">
            <div class="streak-dot" class:filled={currentStreak >= 1}></div>
            <div class="streak-dot" class:filled={currentStreak >= 2}></div>
          </div>
        </div>
      {/if}
      {#if wonCard}
        <div class="won-cards">
          <h3>{t.youWonThisCard}</h3>
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
      <h2 class="result-title">{t.notQuite}</h2>
      <p class="result-message">
        {t.incorrectMessage} <strong>{userAnswer}</strong>, {t.correctMessage.toLowerCase()} <strong>{correctAnswer}</strong>.
      </p>
      {#if needsStreak && streakProgress > 0}
        <p class="streak-lost">{t.language === 'Språk' ? 'Streak reset! Try again.' : 'Rekke tilbakestilt! Prøv igjen.'}</p>
      {/if}
      <p class="encouragement">{t.encouragement}</p>
    {/if}
  </div>

  <button class="next-btn btn-primary" on:click={handleNext}>
    {t.nextQuestion}
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

  .streak-info {
    background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%);
    border: 2px solid rgba(255, 193, 7, 0.3);
    border-radius: var(--border-radius-xl);
    padding: var(--spacing-4);
    margin: var(--spacing-6) 0;
  }

  .streak-text {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: #f57c00;
    margin: 0 0 var(--spacing-3) 0;
    text-align: center;
  }

  .streak-progress {
    display: flex;
    gap: var(--spacing-3);
    justify-content: center;
  }

  .streak-dot {
    width: 20px;
    height: 20px;
    border-radius: var(--border-radius-full);
    background: var(--color-neutral-300);
    border: 2px solid var(--color-neutral-400);
    transition: all var(--transition-fast);
  }

  .streak-dot.filled {
    background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
    border-color: #f57c00;
    box-shadow: 0 0 10px rgba(255, 193, 7, 0.5);
    animation: pulse 0.5s ease-out;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }

  .streak-lost {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: #f57c00;
    margin: var(--spacing-4) 0;
    padding: var(--spacing-3);
    background: rgba(255, 193, 7, 0.1);
    border-radius: var(--border-radius-lg);
    border: 1px solid rgba(255, 193, 7, 0.3);
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
