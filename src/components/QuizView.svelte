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
    <h2 class="quiz-title">TCG Math Challenge</h2>
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

  .quiz-title {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: var(--spacing-8);
    border-radius: var(--border-radius-2xl);
    box-shadow: var(--shadow-xl);
    position: relative;
    overflow: hidden;
  }

  .question-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
    pointer-events: none;
  }

  .question-text {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    color: white;
    text-align: center;
    margin: 0 0 var(--spacing-6) 0;
    line-height: var(--line-height-relaxed);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    position: relative;
    z-index: 1;
  }

  .answer-input-container {
    display: flex;
    gap: var(--spacing-4);
    max-width: 500px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  .answer-input {
    flex: 1;
    padding: var(--spacing-4);
    font-size: var(--font-size-xl);
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: var(--border-radius-lg);
    text-align: center;
    transition: all var(--transition-fast);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    font-weight: var(--font-weight-semibold);
  }

  .answer-input:focus {
    outline: none;
    border-color: white;
    background: white;
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
  }

  .submit-btn {
    font-size: var(--font-size-lg);
    padding: var(--spacing-4) var(--spacing-8);
    white-space: nowrap;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    border: none;
    font-weight: var(--font-weight-bold);
    box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
  }

  .submit-btn:hover:not(:disabled) {
    box-shadow: 0 6px 20px rgba(245, 87, 108, 0.6);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    .quiz-view {
      padding: var(--spacing-4);
    }

    .quiz-title {
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
