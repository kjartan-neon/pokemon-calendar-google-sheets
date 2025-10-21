<script lang="ts">
  import { onMount } from 'svelte';
  import type { PokemonCard, QuizQuestion, CollectedCard, Collection } from './types';
  import { getAllCardsFromSet, getCardDetails, getRandomCard } from './services/tcgdex-api';
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
  let wonCard: PokemonCard | null = null;
  let errorMessage: string = '';
  let currentView: 'quiz' | 'collection' = 'quiz';

  onMount(() => {
    collection = loadCollection();
    loadNewQuestion();
  });

  async function loadNewQuestion() {
    try {
      gameState = 'loading';

      if (allCards.length === 0) {
        allCards = await getAllCardsFromSet();
      }

      const randomCard = getRandomCard(allCards);
      const cardDetails = await getCardDetails(randomCard.id);
      const question = generateQuizQuestion(cardDetails);

      if (!question) {
        throw new Error('Could not generate a valid question. Please try again.');
      }

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

    wonCard = null;
    if (isCorrect) {
      const collectedCard: CollectedCard = {
        id: currentQuestion.card.id,
        name: currentQuestion.card.name,
        image: currentQuestion.card.image,
        hp: currentQuestion.card.hp,
        types: currentQuestion.card.types,
        rarity: currentQuestion.card.rarity,
        collectedAt: new Date().toISOString()
      };

      const added = addCardToCollection(collectedCard);

      if (added) {
        wonCard = currentQuestion.card;
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
    <h1 class="app-title">TCG Math</h1>
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
        My Collection ({collection?.cards.length || 0}/{allCards.length})
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
          {wonCard}
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: var(--shadow-lg);
    padding: var(--spacing-6);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .app-title {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    color: white;
    margin: 0 0 var(--spacing-4) 0;
    text-align: center;
    line-height: var(--line-height-tight);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    letter-spacing: 0.5px;
  }

  nav {
    display: flex;
    justify-content: center;
    gap: var(--spacing-3);
  }

  .nav-btn {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    padding: var(--spacing-3) var(--spacing-6);
    border-radius: var(--border-radius-lg);
    font-weight: var(--font-weight-semibold);
    transition: all var(--transition-fast);
    border: 2px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
  }

  .nav-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .nav-btn.active {
    background: white;
    color: #667eea;
    border-color: white;
  }

  .nav-btn.active:hover {
    background: rgba(255, 255, 255, 0.95);
  }

  main {
    padding: var(--spacing-6) 0;
  }

  @media (max-width: 768px) {
    .app-header {
      padding: var(--spacing-4);
    }

    .app-title {
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
