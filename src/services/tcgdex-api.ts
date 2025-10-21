import type { PokemonCard, PokemonSet } from '../types';

const BASE_URL = 'https://api.tcgdex.net/v2/en';
const TARGET_SET = 'swsh3';

function formatImageUrl(cardId: string): string {
  return `https://assets.tcgdex.net/en/swsh/${TARGET_SET}/${cardId.split('-')[1]}/high.webp`;
}

export async function getTargetSet(): Promise<PokemonSet> {
  try {
    const response = await fetch(`${BASE_URL}/sets/${TARGET_SET}`);
    if (!response.ok) {
      throw new Error('Failed to fetch set');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching set:', error);
    throw error;
  }
}

export async function getAllCardsFromSet(): Promise<PokemonCard[]> {
  try {
    const response = await fetch(`${BASE_URL}/sets/${TARGET_SET}`);
    if (!response.ok) {
      throw new Error('Failed to fetch cards from set');
    }
    const setData = await response.json();
    const cardList = setData.cards || [];

    return cardList.map((card: any) => ({
      id: card.id,
      localId: card.localId,
      name: card.name,
      image: formatImageUrl(card.id)
    }));
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
    const cardData = await response.json();
    return {
      ...cardData,
      image: formatImageUrl(cardId)
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
