<script lang="ts">
  import { onMount } from 'svelte';
  import type { PokemonCard, QuizQuestion, CollectedCard, Collection } from './types';
  import { getCardsForQuiz, getRandomCards } from './services/pokemon-tcg-api';
  import { loadCollection, addCardToCollection, updateStats } from './services/local-storage';
  import { generateQuizQuestion, checkAnswer } from './utils/quiz-logic';
  import QuizView from './components/QuizView.svelte';
  import ResultView from './components/ResultView.svelte';
  import CollectionView from './components/CollectionView.svelte';
  import LoadingView from './components/LoadingView.svelte';
  import ErrorView from './components/ErrorView.svelte';

  type GameState = 'loading' | 'quiz' | 'result' | 'collection' | 'error';

  let gameState: GameState = 'loading';
  let currentQuestion: QuizQuestion | null = null;
  let allCards: PokemonCard[] = [];
  let collection: Collection;
  let isCorrect: boolean = false;
  let userAnswer: number = 0;
  let wonCards: PokemonCard[] = [];
  let errorMessage: string = '';
  let currentView: 'quiz' | 'collection' = 'quiz';

  onMount(() => {
    collection = loadCollection();
    loadNewQuestion();
  });

  async function loadNewQuestion() {
    try {
      console.log('loadNewQuestion called, current allCards.length:', allCards.length);
      gameState = 'loading';

      if (allCards.length < 2) {
        console.log('Fetching new cards...');
        allCards = await getCardsForQuiz();
        console.log('Fetched cards, total:', allCards.length);
      }

      console.log('Getting random cards...');
      const selectedCards = getRandomCards(allCards, 2);
      console.log('Selected cards:', selectedCards.map(c => c.name));

      console.log('Generating quiz question...');
      const question = generateQuizQuestion(selectedCards);

      if (!question) {
        throw new Error('Could not generate a valid question. Please try again.');
      }

      console.log('Question generated successfully');
      currentQuestion = question;
      gameState = 'quiz';
    } catch (error) {
      console.error('Error loading question:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to load question';
      gameState = 'error';
    }
  }

  function handleAnswer(event: CustomEvent<number>) {
    if (!currentQuestion) return;

    userAnswer = event.detail;
    isCorrect = checkAnswer(currentQuestion, userAnswer);

    updateStats(isCorrect);

    wonCards = [];
    if (isCorrect) {
      const collectedCard: CollectedCard = {
        id: currentQuestion.attackerCard.id,
        name: currentQuestion.attackerCard.name,
        image: currentQuestion.attackerCard.image,
        hp: currentQuestion.attackerCard.hp,
        types: currentQuestion.attackerCard.types,
        rarity: currentQuestion.attackerCard.rarity,
        collectedAt: new Date().toISOString()
      };

      const added = addCardToCollection(collectedCard);

      if (added) {
        wonCards.push(currentQuestion.attackerCard);
      }

      const defenderCollectedCard: CollectedCard = {
        id: currentQuestion.defenderCard.id,
        name: currentQuestion.defenderCard.name,
        image: currentQuestion.defenderCard.image,
        hp: currentQuestion.defenderCard.hp,
        types: currentQuestion.defenderCard.types,
        rarity: currentQuestion.defenderCard.rarity,
        collectedAt: new Date().toISOString()
      };

      const defenderAdded = addCardToCollection(defenderCollectedCard);

      if (defenderAdded) {
        wonCards.push(currentQuestion.defenderCard);
      }
    }

    collection = loadCollection();
    gameState = 'result';
  }

  function handleNext() {
    loadNewQuestion();
  }

  function handleRetry() {
    loadNewQuestion();
  }

  function switchToCollection() {
    currentView = 'collection';
    collection = loadCollection();
  }

  function switchToQuiz() {
    currentView = 'quiz';
  }

  function handleRefresh() {
    collection = loadCollection();
  }
</script>

<div class="app">
  <header class="app-header">
    <h1>Pokemon TCG Math Quiz</h1>
    <nav>
      <button
        class="nav-btn"
        class:active={currentView === 'quiz'}
        on:click={switchToQuiz}
      >
        Play Quiz
      </button>
      <button
        class="nav-btn"
        class:active={currentView === 'collection'}
        on:click={switchToCollection}
      >
        My Collection ({collection?.cards.length || 0})
      </button>
    </nav>
  </header>

  <main>
    {#if currentView === 'quiz'}
      {#if gameState === 'loading'}
        <LoadingView message="Loading new question..." />
      {:else if gameState === 'quiz' && currentQuestion}
        <QuizView question={currentQuestion} on:answer={handleAnswer} />
      {:else if gameState === 'result' && currentQuestion}
        <ResultView
          {isCorrect}
          correctAnswer={currentQuestion.correctAnswer}
          {userAnswer}
          {wonCards}
          on:next={handleNext}
        />
      {:else if gameState === 'error'}
        <ErrorView message={errorMessage} on:retry={handleRetry} />
      {/if}
    {:else}
      <CollectionView {collection} on:refresh={handleRefresh} />
    {/if}
  </main>
</div>

<style>
  .app {
    width: 100%;
    min-height: 100vh;
  }

  .app-header {
    background: white;
    box-shadow: var(--shadow-md);
    padding: var(--spacing-6);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .app-header h1 {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-neutral-900);
    margin: 0 0 var(--spacing-4) 0;
    text-align: center;
    line-height: var(--line-height-tight);
  }

  nav {
    display: flex;
    justify-content: center;
    gap: var(--spacing-3);
  }

  .nav-btn {
    background: var(--color-neutral-100);
    color: var(--color-neutral-700);
    padding: var(--spacing-3) var(--spacing-6);
    border-radius: var(--border-radius-lg);
    font-weight: var(--font-weight-semibold);
    transition: all var(--transition-fast);
    border: 2px solid transparent;
  }

  .nav-btn:hover {
    background: var(--color-neutral-200);
    transform: translateY(-1px);
  }

  .nav-btn.active {
    background: var(--color-primary-600);
    color: white;
    border-color: var(--color-primary-700);
  }

  .nav-btn.active:hover {
    background: var(--color-primary-700);
  }

  main {
    padding: var(--spacing-6) 0;
  }

  @media (max-width: 768px) {
    .app-header {
      padding: var(--spacing-4);
    }

    .app-header h1 {
      font-size: var(--font-size-2xl);
    }

    nav {
      flex-direction: column;
    }

    .nav-btn {
      width: 100%;
    }
  }
</style>