import type { Collection, CollectedCard, QuizStats } from '../types';

const COLLECTION_KEY = 'pokemon-tcg-collection';
const STATS_KEY = 'pokemon-tcg-stats';
const CURRENT_VERSION = '2.0';

function getDefaultStats(): QuizStats {
  return {
    totalQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    totalHpDefeated: 0
  };
}

function getDefaultCollection(): Collection {
  return {
    cards: [],
    stats: getDefaultStats(),
    version: CURRENT_VERSION
  };
}

export function loadCollection(): Collection {
  try {
    const stored = localStorage.getItem(COLLECTION_KEY);
    if (!stored) {
      return getDefaultCollection();
    }

    const parsed = JSON.parse(stored);

    if (!parsed.version || !Array.isArray(parsed.cards) || !parsed.stats) {
      console.warn('Invalid collection format, resetting...');
      return getDefaultCollection();
    }

    if (!parsed.stats.totalHpDefeated) {
      parsed.stats.totalHpDefeated = 0;
    }

    if (!parsed.currentStreak) {
      parsed.currentStreak = 0;
    }

    if (!parsed.unlockedRareCards) {
      parsed.unlockedRareCards = [];
    }

    return parsed;
  } catch (error) {
    console.error('Error loading collection from local storage:', error);
    return getDefaultCollection();
  }
}

export function saveCollection(collection: Collection): void {
  try {
    const data = {
      ...collection,
      version: CURRENT_VERSION
    };
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving collection to local storage:', error);
    throw new Error('Failed to save collection');
  }
}

export function addCardToCollection(card: CollectedCard): boolean {
  try {
    const collection = loadCollection();

    const exists = collection.cards.some(c => c.id === card.id);
    if (exists) {
      return false;
    }

    collection.cards.push(card);
    saveCollection(collection);
    return true;
  } catch (error) {
    console.error('Error adding card to collection:', error);
    return false;
  }
}

export function updateStats(correct: boolean, hpDefeated?: number): void {
  try {
    const collection = loadCollection();
    collection.stats.totalQuestions++;
    if (correct) {
      collection.stats.correctAnswers++;
      if (hpDefeated) {
        collection.stats.totalHpDefeated += hpDefeated;
      }
    } else {
      collection.stats.incorrectAnswers++;
    }
    saveCollection(collection);
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

export function getStats(): QuizStats {
  const collection = loadCollection();
  return collection.stats;
}

export function clearCollection(): void {
  try {
    localStorage.removeItem(COLLECTION_KEY);
  } catch (error) {
    console.error('Error clearing collection:', error);
  }
}

export function exportCollection(): string {
  const collection = loadCollection();
  return JSON.stringify(collection, null, 2);
}

export function importCollection(jsonString: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed.version || !Array.isArray(parsed.cards) || !parsed.stats) {
      return { success: false, error: 'Invalid collection format' };
    }

    if (!parsed.stats.totalQuestions === undefined ||
        !parsed.stats.correctAnswers === undefined ||
        !parsed.stats.incorrectAnswers === undefined) {
      return { success: false, error: 'Invalid stats format' };
    }

    saveCollection(parsed);
    return { success: true };
  } catch (error) {
    console.error('Error importing collection:', error);
    return { success: false, error: 'Failed to parse JSON file' };
  }
}
