<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { QuizQuestion } from '../types';
  import PokemonCard from './PokemonCard.svelte';

  export let question: QuizQuestion;

  const dispatch = createEventDispatcher<{ answer: number }>();

  let userInput: string = '';

  function handleSubmit() {
    const answer = parseInt(userInput, 10);
    if (!isNaN(answer)) {
      dispatch('answer', answer);
    }
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }
</script>

<div class="quiz-view">
  <div class="quiz-header">
    <h2>Pok\u00e9mon TCG Quiz</h2>
    <p class="set-info">Collecting Set: Sword & Shield - Darkness Ablaze (swsh3)</p>
  </div>

  <div class="card-display">
    <PokemonCard card={question.card} />
  </div>

  <div class="question-container">
    <h3 class="question-text">{question.questionText}</h3>

    <div class="answer-input-container">
      <input
        type="number"
        bind:value={userInput}
        on:keypress={handleKeyPress}
        placeholder="Enter your answer"
        class="answer-input"
      />
      <button
        class="submit-btn btn-primary"
        on:click={handleSubmit}
        disabled={!userInput}
      >
        Submit Answer
      </button>
    </div>
  </div>
</div>

<style>
  .quiz-view {
    width: 100%;
    max-width: 800px;
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
    margin: 0 0 var(--spacing-2) 0;
    line-height: var(--line-height-tight);
  }

  .set-info {
    font-size: var(--font-size-base);
    color: var(--color-neutral-600);
    margin: 0;
  }

  .card-display {
    display: flex;
    justify-content: center;
    margin-bottom: var(--spacing-8);
  }

  .question-container {
    background: white;
    padding: var(--spacing-8);
    border-radius: var(--border-radius-2xl);
    box-shadow: var(--shadow-lg);
  }

  .question-text {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-neutral-800);
    text-align: center;
    margin: 0 0 var(--spacing-6) 0;
    line-height: var(--line-height-relaxed);
  }

  .answer-input-container {
    display: flex;
    gap: var(--spacing-4);
    max-width: 500px;
    margin: 0 auto;
  }

  .answer-input {
    flex: 1;
    padding: var(--spacing-4);
    font-size: var(--font-size-xl);
    border: 2px solid var(--color-neutral-300);
    border-radius: var(--border-radius-lg);
    text-align: center;
    transition: border-color var(--transition-fast);
  }

  .answer-input:focus {
    outline: none;
    border-color: var(--color-primary-500);
  }

  .submit-btn {
    font-size: var(--font-size-lg);
    padding: var(--spacing-4) var(--spacing-8);
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    .quiz-view {
      padding: var(--spacing-4);
    }

    .quiz-header h2 {
      font-size: var(--font-size-3xl);
    }

    .set-info {
      font-size: var(--font-size-sm);
    }

    .question-text {
      font-size: var(--font-size-xl);
    }

    .answer-input-container {
      flex-direction: column;
    }

    .submit-btn {
      width: 100%;
    }
  }
</style>
