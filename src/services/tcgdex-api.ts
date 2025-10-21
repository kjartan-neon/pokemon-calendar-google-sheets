import type { PokemonCard, PokemonSet } from '../types';

const BASE_URL = 'https://api.tcgdex.net/v2/en';

export async function getLatestSet(): Promise<PokemonSet> {
  try {
    const response = await fetch(`${BASE_URL}/sets`);
    if (!response.ok) {
      throw new Error('Failed to fetch sets');
    }
    const sets: PokemonSet[] = await response.json();

    const sortedSets = sets
      .filter(set => set.cardCount && set.cardCount.total > 20)
      .sort((a, b) => {
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      });

    return sortedSets[0];
  } catch (error) {
    console.error('Error fetching latest set:', error);
    throw error;
  }
}

export async function getCardsFromSet(setId: string): Promise<PokemonCard[]> {
  try {
    const response = await fetch(`${BASE_URL}/sets/${setId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch cards from set');
    }
    const setData = await response.json();

    const cardList = setData.cards || [];
    const detailedCards: PokemonCard[] = [];

    for (let i = 0; i < Math.min(cardList.length, 20); i++) {
      try {
        const cardDetail = await getCardDetails(cardList[i].id);
        if (cardDetail.attacks && cardDetail.attacks.length > 0 && cardDetail.hp && cardDetail.hp > 0) {
          detailedCards.push(cardDetail);
        }
        if (detailedCards.length >= 10) {
          break;
        }
      } catch (error) {
        console.error(`Failed to fetch card ${cardList[i].id}:`, error);
      }
    }

    return detailedCards;
  } catch (error) {
    console.error('Error fetching cards from set:', error);
    throw error;
  }
}

export async function getCardDetails(cardId: string): Promise<PokemonCard> {
  try {
    const response = await fetch(`${BASE_URL}/cards/${cardId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch card details');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching card details:', error);
    throw error;
  }
}

export function getRandomCards(cards: PokemonCard[], count: number): PokemonCard[] {
  const cardsWithAttacksAndHP = cards.filter(card =>
    card.attacks &&
    card.attacks.length > 0 &&
    card.hp &&
    card.hp > 0
  );

  if (cardsWithAttacksAndHP.length < count) {
    throw new Error('Not enough valid cards in the set');
  }

  const shuffled = [...cardsWithAttacksAndHP].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
