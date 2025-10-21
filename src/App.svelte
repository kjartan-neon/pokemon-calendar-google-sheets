<script lang="ts">
  import { onMount } from 'svelte';
  import type { PokemonCard, QuizQuestion, CollectedCard, Collection } from './types';
  import { getAllCardsFromSet, getCardDetails, getRandomCard } from './services/tcgdex-api';
  import { loadCollection, addCardToCollection, updateStats, saveCollection } from './services/local-storage';
  import { generateQuizQuestion, checkAnswer } from './utils/quiz-logic';
  import { language, selectedSet, availableSets } from './stores/settings';
  import { getTranslations } from './i18n/translations';
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
  let showLanguageDialog = false;
  let currentSetId: string = $selectedSet;
  let needsStreak = false;
  let streakProgress = 0;

  $: t = getTranslations($language);

  onMount(() => {
    collection = loadCollection();
    const hasSeenLanguageDialog = localStorage.getItem('tcg-seen-language-dialog');
    if (!hasSeenLanguageDialog) {
      showLanguageDialog = true;
    } else {
      loadNewQuestion();
    }
  });

  function handleSetChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedSet.set(target.value);
    currentSetId = target.value;
    allCards = [];
    loadNewQuestion();
  }

  function handleLanguageChange(value: string) {
    language.set(value as 'en' | 'no');
  }

  function handleLanguageSelect(selectedLanguage: 'en' | 'no') {
    language.set(selectedLanguage);
    localStorage.setItem('tcg-seen-language-dialog', 'true');
    showLanguageDialog = false;
    loadNewQuestion();
  }

  async function loadNewQuestion() {
    try {
      gameState = 'loading';

      if (allCards.length === 0) {
        allCards = await getAllCardsFromSet(currentSetId);
      }

      const collectedCardIds = new Set(collection.cards.map(c => c.id));
      const availableCards = allCards.filter(card => !collectedCardIds.has(card.id));

      if (availableCards.length === 0) {
        throw new Error('Congratulations! You have collected all cards from this set!');
      }

      const randomCard = getRandomCard(availableCards);
      const cardDetails = await getCardDetails(randomCard.id, currentSetId);
      const question = generateQuizQuestion(cardDetails);

      if (!question) {
        throw new Error('Could not generate a valid question. Please try again.');
      }

      const rarity = cardDetails.rarity?.toLowerCase() || 'common';
      needsStreak = rarity !== 'common';

      if (collection.streakCard && collection.streakCard.id === cardDetails.id) {
        streakProgress = collection.currentStreak || 0;
      } else {
        streakProgress = 0;
      }

      currentQuestion = question;
      gameState = 'quiz';
    } catch (error) {
      console.error('Error loading question:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to load question';
      gameState = 'error';
    }
  }

  async function checkAndUnlockRareCards() {
    const previousMilestones = Math.floor((collection.stats.totalHpDefeated - (currentQuestion?.card.hp || 0)) / 16000);
    const currentMilestones = Math.floor(collection.stats.totalHpDefeated / 16000);

    if (currentMilestones > previousMilestones) {
      const cardsToUnlock = currentMilestones - previousMilestones;

      if (allCards.length === 0) {
        allCards = await getAllCardsFromSet(currentSetId);
      }

      const sortedCards = [...allCards].sort((a, b) => {
        const numA = parseInt(a.localId || '0');
        const numB = parseInt(b.localId || '0');
        return numB - numA;
      });

      const alreadyUnlockedIds = new Set((collection.unlockedRareCards || []).map(c => c.id));
      const availableRareCards = sortedCards.filter(card => !alreadyUnlockedIds.has(card.id));

      const cardsToAdd = availableRareCards.slice(0, cardsToUnlock * 5);

      if (!collection.unlockedRareCards) {
        collection.unlockedRareCards = [];
      }

      cardsToAdd.forEach(card => {
        const collectedCard: CollectedCard = {
          id: card.id,
          name: card.name,
          image: card.image,
          hp: card.hp,
          types: card.types,
          rarity: card.rarity,
          collectedAt: new Date().toISOString()
        };
        collection.unlockedRareCards!.push(collectedCard);
      });

      saveCollection(collection);
    }
  }

  function handleAnswer(event: CustomEvent<number>) {
    if (!currentQuestion) return;

    userAnswer = event.detail;
    isCorrect = checkAnswer(currentQuestion, userAnswer);

    const hpDefeated = isCorrect && currentQuestion.card.hp ? currentQuestion.card.hp : 0;
    updateStats(isCorrect, hpDefeated);

    wonCard = null;
    if (isCorrect) {
      let canCollect = false;

      if (needsStreak) {
        collection = loadCollection();

        if (collection.streakCard?.id === currentQuestion.card.id) {
          collection.currentStreak = (collection.currentStreak || 0) + 1;
        } else {
          collection.streakCard = currentQuestion.card;
          collection.currentStreak = 1;
        }

        if (collection.currentStreak >= 2) {
          canCollect = true;
          collection.currentStreak = 0;
          collection.streakCard = undefined;
        }

        saveCollection(collection);
      } else {
        canCollect = true;
      }

      if (canCollect) {
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
    } else {
      collection = loadCollection();
      if (needsStreak && collection.streakCard?.id === currentQuestion.card.id) {
        collection.currentStreak = 0;
        collection.streakCard = undefined;
        saveCollection(collection);
      }
    }

    collection = loadCollection();

    if (isCorrect) {
      checkAndUnlockRareCards();
      collection = loadCollection();
    }

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
    <div class="header-content">
      <h1 class="app-title">{t.appTitle}</h1>
      <nav>
      <button
        class="nav-btn"
        class:active={currentView === 'quiz'}
        on:click={switchToQuiz}
      >
        {t.playQuiz}
      </button>
      <button
        class="nav-btn"
        class:active={currentView === 'collection'}
        on:click={switchToCollection}
      >
        {t.myCollection} ({collection?.cards.length || 0}/{allCards.length})
      </button>
      </nav>
    </div>
  </header>

  <main>
    {#if currentView === 'quiz'}
      {#if gameState === 'loading'}
        <LoadingView message={t.loading} />
      {:else if gameState === 'quiz' && currentQuestion}
        <div class="set-selector-container">
          <select class="set-selector" value={$selectedSet} on:change={handleSetChange}>
            {#each availableSets as set}
              <option value={set.id}>{set.name}</option>
            {/each}
          </select>
        </div>
        <QuizView question={currentQuestion} {t} currentSet={availableSets.find(s => s.id === currentSetId)?.name || ''} on:answer={handleAnswer} />
      {:else if gameState === 'result' && currentQuestion}
        <ResultView
          {isCorrect}
          correctAnswer={currentQuestion.correctAnswer}
          {userAnswer}
          {wonCard}
          {t}
          {needsStreak}
          {streakProgress}
          currentStreak={collection.currentStreak || 0}
          on:next={handleNext}
        />
      {:else if gameState === 'error'}
        <ErrorView message={errorMessage} on:retry={handleRetry} />
      {/if}
    {:else}
      <CollectionView {collection} {t} language={$language} on:refresh={handleRefresh} on:languageChange={(e) => handleLanguageChange(e.detail)} />
    {/if}
  </main>

{#if showLanguageDialog}
  <div class="dialog-overlay" role="button" tabindex="-1">
    <div class="dialog language-dialog">
      <h2>{$language === 'en' ? 'Choose Your Language' : 'Velg språk'}</h2>
      <p>{$language === 'en' ? 'You can change this anytime in My Collection' : 'Du kan endre dette når som helst i Min samling'}</p>
      <div class="language-buttons">
        <button class="language-btn" on:click={() => handleLanguageSelect('en')}>
          <span class="flag">🇬🇧</span>
          <span>English</span>
        </button>
        <button class="language-btn" on:click={() => handleLanguageSelect('no')}>
          <span class="flag">🇳🇴</span>
          <span>Norsk</span>
        </button>
      </div>
    </div>
  </div>
{/if}
</div>

<style>
  .app {
    width: 100%;
    min-height: 100vh;
  }

  .app-header {
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: var(--shadow-lg);
    padding: var(--spacing-6);
    overflow: hidden;
    position: relative;
  }

  .app-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%);
    background-size: 200% 200%;
    animation: gradientShift 8s ease infinite;
    z-index: 0;
  }

  .app-header::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    animation: shimmerSlide 3s infinite;
    z-index: 1;
  }

  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  @keyframes shimmerSlide {
    0% {
      left: -100%;
    }
    100% {
      left: 200%;
    }
  }

  .header-content {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-6);
  }

  .app-title {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    color: white;
    margin: 0;
    text-align: left;
    line-height: var(--line-height-tight);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    letter-spacing: 0.5px;
    flex-shrink: 0;
  }


  .set-selector-container {
    display: flex;
    justify-content: center;
    margin-bottom: var(--spacing-6);
    padding: 0 var(--spacing-6);
  }

  .set-selector {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
    backdrop-filter: blur(10px);
    color: var(--color-neutral-900);
    padding: var(--spacing-3) var(--spacing-6);
    border-radius: var(--border-radius-xl);
    font-weight: var(--font-weight-semibold);
    transition: all var(--transition-fast);
    border: 2px solid rgba(102, 126, 234, 0.3);
    cursor: pointer;
    font-size: var(--font-size-base);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .set-selector:hover {
    background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.95) 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    border-color: rgba(102, 126, 234, 0.5);
  }

  .set-selector:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  }

  .set-selector option {
    background: white;
    color: var(--color-neutral-900);
  }

  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn var(--transition-fast) ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .dialog {
    background: white;
    border-radius: var(--border-radius-2xl);
    padding: var(--spacing-8);
    max-width: 500px;
    width: 90%;
    box-shadow: var(--shadow-xl);
    animation: slideUp var(--transition-normal) ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .language-dialog h2 {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 var(--spacing-3) 0;
    text-align: center;
  }

  .language-dialog p {
    font-size: var(--font-size-base);
    color: var(--color-neutral-600);
    text-align: center;
    margin: 0 0 var(--spacing-8) 0;
    line-height: var(--line-height-relaxed);
  }

  .language-buttons {
    display: flex;
    gap: var(--spacing-4);
    justify-content: center;
  }

  .language-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-6);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
    border: 2px solid rgba(102, 126, 234, 0.3);
    border-radius: var(--border-radius-xl);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-neutral-900);
    min-width: 140px;
  }

  .language-btn:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
    background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.9) 100%);
    border-color: #667eea;
  }

  .language-btn .flag {
    font-size: 3rem;
  }

  nav {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-3);
    flex: 1;
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

    .header-content {
      flex-direction: column;
      gap: var(--spacing-4);
    }

    .app-title {
      font-size: var(--font-size-2xl);
      text-align: center;
    }

    nav {
      flex-direction: column;
      width: 100%;
    }

    .nav-btn {
      width: 100%;
    }

    .set-selector-container {
      padding: 0 var(--spacing-4);
    }

    .language-buttons {
      flex-direction: column;
    }

    .language-btn {
      width: 100%;
    }
  }
</style>
