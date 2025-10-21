<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { QuizQuestion } from '../types';
  import type { Translations } from '../i18n/translations';
  import PokemonCard from './PokemonCard.svelte';

  export let question: QuizQuestion;
  export let t: Translations;
  export let currentSet: string;

  const dispatch = createEventDispatcher<{ answer: { firstAnswer: number; secondAnswer?: number } }>();

  let userInput: string = '';
  let secondUserInput: string = '';

  function handleSubmit() {
    const answer = parseInt(userInput, 10);
    if (!isNaN(answer)) {
      if (question.secondQuestion && question.secondAnswer !== undefined) {
        const secondAnswer = parseInt(secondUserInput, 10);
        if (!isNaN(secondAnswer)) {
          dispatch('answer', { firstAnswer: answer, secondAnswer });
        }
      } else {
        dispatch('answer', { firstAnswer: answer });
      }
    }
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }
</script>

<div class="quiz-view">
  <div class="card-display">
    <PokemonCard card={question.card} showRarity={true} />
  </div>

  <div class="question-container">
    <div class="questions-list">
      <div class="question-item">
        {#if question.secondQuestion}
          <span class="question-number">1.</span>
        {/if}
        <h3 class="question-text">{question.questionText}</h3>
      </div>
      <div class="input-group">
        
        <input
          type="number"
          bind:value={userInput}
          on:keypress={handleKeyPress}
          placeholder={t.enterAnswer}
          class="answer-input"
        />
      </div>
      {#if question.secondQuestion}
        <div class="question-item">
          <span class="question-number">2.</span>
          <h3 class="question-text">{question.secondQuestion}</h3>
        </div>
      {/if}


      {#if question.secondQuestion}
        <div class="input-group">
          
          <input
            type="number"
            bind:value={secondUserInput}
            on:keypress={handleKeyPress}
            placeholder={t.enterAnswer}
            class="answer-input"
          />
        </div>
      {/if}
      <button
        class="submit-btn btn-primary"
        on:click={handleSubmit}
        disabled={!userInput || (question.secondQuestion && !secondUserInput)}
      >
        {t.submitAnswer}
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

  .questions-list {
    margin-bottom: var(--spacing-6);
    position: relative;
    z-index: 1;
  }

  .question-item {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-2);
    margin-bottom: var(--spacing-4);
  }

  .question-item:last-child {
    margin-bottom: 0;
  }

  .question-number {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: white;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    min-width: 40px;
  }

  .question-text {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: white;
    margin: 0;
    line-height: var(--line-height-relaxed);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    flex: 1;
  }

  .answer-inputs-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    max-width: 500px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .input-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: white;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
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
      font-size: var(--font-size-lg);
    }

    .question-number {
      font-size: var(--font-size-xl);
    }

    .submit-btn {
      width: 100%;
    }
  }
</style>
