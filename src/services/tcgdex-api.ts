import type { PokemonCard, PokemonSet } from '../types';

const BASE_URL = 'https://api.tcgdex.net/v2/en';

function formatImageUrl(cardId: string, setId: string): string {
  const localId = cardId.split('-')[1];
  const series = getSeriesFromSet(setId);
  return `https://assets.tcgdex.net/en/${series}/${setId}/${localId}/high.webp`;
}

function getSeriesFromSet(setId: string): string {
  if (setId.startsWith('swsh')) return 'swsh';
  if (setId.startsWith('sv')) return 'sv';
  if (setId.startsWith('me')) return 'base';
  return 'swsh';
}

export async function getTargetSet(setId: string): Promise<PokemonSet> {
  try {
    const response = await fetch(`${BASE_URL}/sets/${setId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch set');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching set:', error);
    throw error;
  }
}

export async function getAllCardsFromSet(setId: string): Promise<PokemonCard[]> {
  try {
    const response = await fetch(`${BASE_URL}/sets/${setId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch cards from set');
    }
    const setData = await response.json();
    const cardList = setData.cards || [];

    return cardList.map((card: any) => ({
      id: card.id,
      localId: card.localId,
      name: card.name,
      image: formatImageUrl(card.id, setId)
    }));
  } catch (error) {
    console.error('Error fetching cards from set:', error);
    throw error;
  }
}

export async function getCardDetails(cardId: string, setId: string): Promise<PokemonCard> {
  try {
    const response = await fetch(`${BASE_URL}/cards/${cardId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch card details');
    }
    const cardData = await response.json();
    return {
      ...cardData,
      image: formatImageUrl(cardId, setId)
    };
  } catch (error) {
    console.error('Error fetching card details:', error);
    throw error;
  }
}

export function getRandomCard(cards: PokemonCard[]): PokemonCard {
  const randomIndex = Math.floor(Math.random() * cards.length);
  return cards[randomIndex];
}
