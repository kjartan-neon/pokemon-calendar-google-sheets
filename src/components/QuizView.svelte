<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { QuizQuestion } from '../types';
  import PokemonCard from './PokemonCard.svelte';

  export let question: QuizQuestion;

  const dispatch = createEventDispatcher<{ answer: number }>();

  let selectedAnswer: number | null = null;

  function handleAnswer(answer: number) {
    selectedAnswer = answer;
    dispatch('answer', answer);
  }
</script>

<div class="quiz-view">
  <div class="quiz-header">
    <h2>Pokemon Math Challenge!</h2>
    <p class="quiz-question">
      How many times does <strong>{question.attackerCard.name}</strong> need to use
      <strong>{question.selectedAttack.name}</strong>
      ({question.selectedAttack.damage} damage)
      to knock out <strong>{question.defenderCard.name}</strong>?
    </p>
  </div>

  <div class="cards-container">
    <div class="card-wrapper">
      <div class="card-label">Attacker</div>
      <PokemonCard
        card={question.attackerCard}
        showAttacks={true}
        highlightedAttack={question.selectedAttack.name}
      />
    </div>

    <div class="vs-divider">
      <span>VS</span>
    </div>

    <div class="card-wrapper">
      <div class="card-label">Defender</div>
      <PokemonCard card={question.defenderCard} />
    </div>
  </div>

  <div class="answers-container">
    <h3>Choose your answer:</h3>
    <div class="answer-buttons">
      {#each question.options as option}
        <button
          class="answer-btn btn-primary"
          on:click={() => handleAnswer(option)}
          disabled={selectedAnswer !== null}
        >
          {option} {option === 1 ? 'hit' : 'hits'}
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .quiz-view {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-6);
  }

  .quiz-header {
    text-align: center;
    margin-bottom: var(--spacing-8);
  }

  .quiz-header h2 {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-neutral-900);
    margin: 0 0 var(--spacing-4) 0;
    line-height: var(--line-height-tight);
  }

  .quiz-question {
    font-size: var(--font-size-lg);
    color: var(--color-neutral-700);
    line-height: var(--line-height-relaxed);
    max-width: 800px;
    margin: 0 auto;
  }

  .quiz-question strong {
    color: var(--color-primary-700);
    font-weight: var(--font-weight-bold);
  }

  .cards-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--spacing-8);
    margin-bottom: var(--spacing-8);
    flex-wrap: wrap;
  }

  .card-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-3);
  }

  .card-label {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-neutral-600);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .vs-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700));
    border-radius: var(--border-radius-full);
    box-shadow: var(--shadow-lg);
    flex-shrink: 0;
  }

  .vs-divider span {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: white;
  }

  .answers-container {
    text-align: center;
  }

  .answers-container h3 {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-neutral-800);
    margin: 0 0 var(--spacing-6) 0;
  }

  .answer-buttons {
    display: flex;
    gap: var(--spacing-4);
    justify-content: center;
    flex-wrap: wrap;
  }

  .answer-btn {
    font-size: var(--font-size-xl);
    padding: var(--spacing-4) var(--spacing-8);
    min-width: 140px;
  }

  @media (max-width: 1024px) {
    .cards-container {
      gap: var(--spacing-6);
    }

    .vs-divider {
      width: 60px;
      height: 60px;
    }

    .vs-divider span {
      font-size: var(--font-size-xl);
    }
  }

  @media (max-width: 768px) {
    .quiz-view {
      padding: var(--spacing-4);
    }

    .quiz-header h2 {
      font-size: var(--font-size-3xl);
    }

    .quiz-question {
      font-size: var(--font-size-base);
    }

    .cards-container {
      flex-direction: column;
      gap: var(--spacing-4);
    }

    .vs-divider {
      transform: rotate(90deg);
    }

    .answer-buttons {
      flex-direction: column;
      align-items: stretch;
    }

    .answer-btn {
      width: 100%;
    }
  }
</style>
