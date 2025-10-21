<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { Collection, CollectedCard, PokemonCard } from '../types';
  import type { Translations } from '../i18n/translations';
  import { downloadBackup, uploadBackup } from '../utils/backup';
  import { clearCollection } from '../services/local-storage';
  import { selectedSet } from '../stores/settings';
  import { getAllCardsFromSet } from '../services/tcgdex-api';

  export let collection: Collection;
  export let t: Translations;
  export let language: 'en' | 'no';

  let selectedCard: CollectedCard | null = null;
  let allCards: PokemonCard[] = [];
  let rareCards: PokemonCard[] = [];

  onMount(async () => {
    await loadRareCards();
  });

  async function loadRareCards() {
    try {
      allCards = await getAllCardsFromSet($selectedSet);
      const sortedCards = [...allCards].sort((a, b) => {
        const numA = parseInt(a.localId || '0');
        const numB = parseInt(b.localId || '0');
        return numB - numA;
      });
      rareCards = sortedCards.slice(0, 5);
    } catch (error) {
      console.error('Error loading rare cards:', error);
    }
  }

  const dispatch = createEventDispatcher<{ refresh: void; languageChange: string }>();

  let fileInput: HTMLInputElement;
  let message: { text: string; type: 'success' | 'error' } | null = null;
  let showClearDialog = false;

  function handleExport() {
    try {
      downloadBackup();
      showMessage(t.collectionExported, 'success');
    } catch (error) {
      showMessage(t.exportFailed, 'error');
    }
  }

  function handleImportClick() {
    fileInput.click();
  }

  async function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    try {
      const result = await uploadBackup(file);
      if (result.success) {
        showMessage(t.collectionImported, 'success');
        dispatch('refresh');
      } else {
        showMessage(result.error || t.importFailed, 'error');
      }
    } catch (error) {
      showMessage(t.importFailed, 'error');
    }

    target.value = '';
  }

  function showMessage(text: string, type: 'success' | 'error') {
    message = { text, type };
    setTimeout(() => {
      message = null;
    }, 3000);
  }

  function handleClearClick() {
    showClearDialog = true;
  }

  function handleClearCancel() {
    showClearDialog = false;
  }

  function handleClearConfirm() {
    try {
      clearCollection();
      showClearDialog = false;
      showMessage(t.collectionCleared, 'success');
      dispatch('refresh');
    } catch (error) {
      showMessage(t.clearFailed, 'error');
    }
  }

  function handleLanguageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    dispatch('languageChange', target.value);
  }

  $: accuracy = collection.stats.totalQuestions > 0
    ? Math.round((collection.stats.correctAnswers / collection.stats.totalQuestions) * 100)
    : 0;

  $: hpToUnlock = 16000 - (collection.stats.totalHpDefeated || 0);
  $: isUnlocked = (collection.unlockedRareSets && collection.unlockedRareSets[$selectedSet]) || false;
  $: progressPercent = Math.min((collection.stats.totalHpDefeated / 16000) * 100, 100);

  function openCardModal(card: CollectedCard) {
    selectedCard = card;
  }

  function closeCardModal() {
    selectedCard = null;
  }
</script>

<div class="collection-view">
  <div class="rare-cards-section">
    <div class="rare-section-text">
      {#if isUnlocked}
        {t.language === 'Språk' ? 'Rare cards unlocked!' : 'Sjeldne kort låst opp!'}
      {:else}
        {t.language === 'Språk' ? `Defeat ${hpToUnlock > 0 ? hpToUnlock.toLocaleString() : 0} HP to unlock 5 rare cards` : `Beseir ${hpToUnlock > 0 ? hpToUnlock.toLocaleString() : 0} HP for å låse opp 5 sjeldne kort`}
      {/if}
    </div>
    {#if !isUnlocked}
      <div class="hp-progress-bar">
        <div class="hp-progress-fill" style="width: {progressPercent}%"></div>
      </div>
    {/if}
    <div class="rare-cards-thumbnails">
      {#each rareCards as card}
        <button
          class="rare-thumbnail"
          class:unlocked={isUnlocked}
          on:click={() => isUnlocked && openCardModal({ ...card, collectedAt: new Date().toISOString() })}
          disabled={!isUnlocked}
        >
          <img src={card.image} alt={card.name} class:locked={!isUnlocked} />
        </button>
      {/each}
    </div>
  </div>

  <div class="collection-header">
    <h2>{t.yourCollection}</h2>
    <div class="header-controls">
      <div class="language-selector-container">
        <label for="language-select">{t.language || 'Language'}:</label>
        <select id="language-select" class="language-selector" value={language} on:change={handleLanguageChange}>
          <option value="en">English</option>
          <option value="no">Norsk</option>
        </select>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" on:click={handleExport}>
          {t.exportBackup}
        </button>
        <button class="btn-secondary" on:click={handleImportClick}>
          {t.importBackup}
        </button>
        <button class="btn-error" on:click={handleClearClick}>
          {t.clearThisSet}
        </button>
        <input
          type="file"
          bind:this={fileInput}
          on:change={handleFileChange}
          accept=".json"
          style="display: none;"
        />
      </div>
    </div>
  </div>

  {#if message}
    <div class="message" class:success={message.type === 'success'} class:error={message.type === 'error'}>
      {message.text}
    </div>
  {/if}

  <div class="stats-section">
    <div class="stat-card">
      <div class="stat-value">{collection.cards.length}</div>
      <div class="stat-label">{t.cardsCollected}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{collection.stats.totalQuestions}</div>
      <div class="stat-label">{t.questionsAnswered}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{collection.stats.correctAnswers}</div>
      <div class="stat-label">{t.correctAnswers}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{accuracy}%</div>
      <div class="stat-label">{t.accuracy}</div>
    </div>
  </div>

  {#if collection.cards.length === 0}
    <div class="empty-state">
      <div class="empty-icon">📦</div>
      <h3>{t.noCardsYet}</h3>
      <p>{t.noCardsDescription}</p>
    </div>
  {:else}
    <div class="cards-grid">
      {#each collection.cards as card}
        <button class="collection-card" on:click={() => openCardModal(card)}>
          <img src={card.image} alt={card.name} />
          <div class="card-details">
            <h4>{card.name}</h4>
            {#if card.hp}
              <span class="hp">HP {card.hp}</span>
            {/if}
            {#if card.types && card.types.length > 0}
              <div class="types">
                {#each card.types as type}
                  <span class="type">{type}</span>
                {/each}
              </div>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

{#if selectedCard}
  <div class="dialog-overlay" on:click={closeCardModal} on:keydown={(e) => e.key === 'Escape' && closeCardModal()} role="button" tabindex="-1">
    <div class="card-modal" on:click|stopPropagation role="dialog">
      <button class="close-modal" on:click={closeCardModal}>&times;</button>
      <img src={selectedCard.image} alt={selectedCard.name} class="modal-card-image" />
      <div class="modal-card-info">
        <h3>{selectedCard.name}</h3>
        {#if selectedCard.hp}
          <div class="modal-hp">HP: {selectedCard.hp}</div>
        {/if}
        {#if selectedCard.types && selectedCard.types.length > 0}
          <div class="modal-types">
            {#each selectedCard.types as type}
              <span class="modal-type">{type}</span>
            {/each}
          </div>
        {/if}
        {#if selectedCard.rarity}
          <div class="modal-rarity">Rarity: {selectedCard.rarity}</div>
        {/if}
      </div>
    </div>
  </div>
{/if}

{#if showClearDialog}
  <div class="dialog-overlay" on:click={handleClearCancel} on:keydown={(e) => e.key === 'Escape' && handleClearCancel()} role="button" tabindex="-1">
    <div class="dialog" on:click|stopPropagation on:keydown={() => {}} role="dialog">
      <h3>{t.clearCollectionTitle}</h3>
      <p>{t.clearCollectionMessage}</p>
      <div class="dialog-actions">
        <button class="btn-secondary" on:click={handleClearCancel}>
          {t.cancel}
        </button>
        <button class="btn-error" on:click={handleClearConfirm}>
          {t.clearCollection}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .collection-view {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: var(--spacing-6);
  }

  .rare-cards-section {
    background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%);
    border: 2px solid rgba(255, 193, 7, 0.3);
    border-radius: var(--border-radius-xl);
    padding: var(--spacing-4);
    margin-bottom: var(--spacing-8);
  }

  .rare-section-text {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: #f57c00;
    text-align: center;
    margin-bottom: var(--spacing-2);
  }

  .rare-cards-thumbnails {
    display: flex;
    gap: var(--spacing-2);
    justify-content: center;
    margin-top: var(--spacing-3);
  }

  .rare-thumbnail {
    width: 60px;
    height: 84px;
    border-radius: var(--border-radius-md);
    overflow: hidden;
    border: 2px solid rgba(255, 193, 7, 0.5);
    padding: 0;
    background: transparent;
    transition: all var(--transition-fast);
    cursor: pointer;
  }

  .rare-thumbnail:disabled {
    cursor: not-allowed;
  }

  .rare-thumbnail.unlocked:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
    border-color: #f57c00;
  }

  .rare-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .rare-thumbnail img.locked {
    filter: brightness(0.3) grayscale(1);
  }

  .hp-progress-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: var(--border-radius-full);
    overflow: hidden;
    border: 1px solid rgba(255, 193, 7, 0.3);
    margin-bottom: var(--spacing-3);
  }

  .hp-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #ffc107 0%, #ff9800 100%);
    transition: width var(--transition-normal);
    border-radius: var(--border-radius-full);
  }

  .collection-header {
    margin-bottom: var(--spacing-8);
  }

  .collection-header h2 {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    line-height: var(--line-height-tight);
  }

  .header-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-4);
    margin-top: var(--spacing-4);
  }

  .language-selector-container {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
  }

  .language-selector-container label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-neutral-700);
  }

  .language-selector {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
    backdrop-filter: blur(10px);
    color: var(--color-neutral-900);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--border-radius-lg);
    font-weight: var(--font-weight-semibold);
    transition: all var(--transition-fast);
    border: 2px solid rgba(102, 126, 234, 0.3);
    cursor: pointer;
    font-size: var(--font-size-sm);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .language-selector:hover {
    background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.95) 100%);
    border-color: rgba(102, 126, 234, 0.5);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .language-selector:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  }

  .language-selector option {
    background: white;
    color: var(--color-neutral-900);
  }

  .header-actions {
    display: flex;
    gap: var(--spacing-3);
  }

  .message {
    padding: var(--spacing-4);
    border-radius: var(--border-radius-lg);
    margin-bottom: var(--spacing-6);
    text-align: center;
    font-weight: var(--font-weight-medium);
    animation: slideDown var(--transition-normal) ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .message.success {
    background: var(--color-success-100);
    color: var(--color-success-800);
    border: 2px solid var(--color-success-500);
  }

  .message.error {
    background: var(--color-error-100);
    color: var(--color-error-800);
    border: 2px solid var(--color-error-500);
  }

  .stats-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-4);
    margin-bottom: var(--spacing-8);
  }

  .stat-card {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
    backdrop-filter: blur(10px);
    border-radius: var(--border-radius-xl);
    padding: var(--spacing-6);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    text-align: center;
    transition: all var(--transition-fast);
    border: 1px solid rgba(255, 255, 255, 0.5);
  }

  .stat-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
  }

  .stat-value {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: var(--line-height-tight);
  }

  .stat-label {
    font-size: var(--font-size-sm);
    color: var(--color-neutral-600);
    font-weight: var(--font-weight-medium);
    margin-top: var(--spacing-2);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .empty-state {
    text-align: center;
    padding: var(--spacing-16) var(--spacing-6);
  }

  .empty-icon {
    font-size: 5rem;
    margin-bottom: var(--spacing-6);
  }

  .empty-state h3 {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-neutral-700);
    margin: 0 0 var(--spacing-3) 0;
  }

  .empty-state p {
    font-size: var(--font-size-lg);
    color: var(--color-neutral-600);
    margin: 0;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--spacing-6);
  }

  .collection-card {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.8) 100%);
    backdrop-filter: blur(10px);
    border-radius: var(--border-radius-xl);
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: all var(--transition-normal);
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.5);
    padding: 0;
    text-align: left;
    width: 100%;
  }

  .collection-card:hover {
    transform: translateY(-8px) scale(1.03);
    box-shadow: 0 16px 64px rgba(0, 0, 0, 0.2);
  }

  .collection-card img {
    width: 100%;
    aspect-ratio: 5/7;
    object-fit: contain;
    background: var(--color-neutral-100);
  }

  .card-details {
    padding: var(--spacing-4);
  }

  .card-details h4 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-neutral-900);
    margin: 0 0 var(--spacing-2) 0;
    line-height: var(--line-height-tight);
  }

  .hp {
    display: inline-block;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-error-600);
    margin-bottom: var(--spacing-2);
  }

  .types {
    display: flex;
    gap: var(--spacing-2);
    flex-wrap: wrap;
  }

  .type {
    background: var(--color-neutral-200);
    color: var(--color-neutral-700);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--border-radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
  }

  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
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

  .card-modal {
    background: white;
    border-radius: var(--border-radius-2xl);
    padding: var(--spacing-8);
    max-width: 600px;
    width: 90%;
    box-shadow: var(--shadow-xl);
    animation: slideUp var(--transition-normal) ease-out;
    position: relative;
  }

  .close-modal {
    position: absolute;
    top: var(--spacing-4);
    right: var(--spacing-4);
    background: var(--color-neutral-200);
    border: none;
    border-radius: var(--border-radius-full);
    width: 40px;
    height: 40px;
    font-size: var(--font-size-3xl);
    line-height: 1;
    cursor: pointer;
    transition: all var(--transition-fast);
    color: var(--color-neutral-700);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-modal:hover {
    background: var(--color-neutral-300);
    transform: scale(1.1);
  }

  .modal-card-image {
    width: 100%;
    max-width: 400px;
    height: auto;
    margin: 0 auto var(--spacing-6) auto;
    display: block;
    border-radius: var(--border-radius-xl);
    box-shadow: var(--shadow-lg);
  }

  .modal-card-info {
    text-align: center;
  }

  .modal-card-info h3 {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-neutral-900);
    margin: 0 0 var(--spacing-3) 0;
  }

  .modal-hp {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-error-600);
    margin-bottom: var(--spacing-3);
  }

  .modal-types {
    display: flex;
    gap: var(--spacing-2);
    justify-content: center;
    margin-bottom: var(--spacing-3);
    flex-wrap: wrap;
  }

  .modal-type {
    background: var(--color-neutral-200);
    color: var(--color-neutral-700);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--border-radius-full);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }

  .modal-rarity {
    font-size: var(--font-size-base);
    color: var(--color-neutral-600);
    font-style: italic;
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

  .dialog h3 {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-neutral-900);
    margin: 0 0 var(--spacing-4) 0;
  }

  .dialog p {
    font-size: var(--font-size-base);
    color: var(--color-neutral-700);
    line-height: var(--line-height-relaxed);
    margin: 0 0 var(--spacing-6) 0;
  }

  .dialog-actions {
    display: flex;
    gap: var(--spacing-3);
    justify-content: flex-end;
  }

  @media (max-width: 768px) {
    .collection-view {
      padding: var(--spacing-4);
    }

    .collection-header h2 {
      font-size: var(--font-size-3xl);
    }

    .header-controls {
      flex-direction: column;
      align-items: stretch;
    }

    .language-selector-container {
      justify-content: space-between;
    }

    .header-actions {
      flex-direction: column;
    }

    .stats-section {
      grid-template-columns: repeat(2, 1fr);
    }

    .cards-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: var(--spacing-4);
    }
  }
</style>
