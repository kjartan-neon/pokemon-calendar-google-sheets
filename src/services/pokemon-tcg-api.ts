import type { PokemonCard } from '../types';

const BASE_URL = 'https://api.pokemontcg.io/v2';
const API_KEY = import.meta.env.VITE_POKEMON_TCG_API_KEY;

interface PokemonTCGAPICard {
  id: string;
  name: string;
  hp?: string;
  images: {
    small: string;
    large: string;
  };
  attacks?: Array<{
    name: string;
    cost?: string[];
    damage?: string;
    text?: string;
  }>;
  types?: string[];
  rarity?: string;
  set: {
    id: string;
    name: string;
  };
}

interface PokemonTCGAPIResponse {
  data: PokemonTCGAPICard[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

function getHeaders(): HeadersInit {
  return {
    'X-Api-Key': API_KEY,
    'Content-Type': 'application/json'
  };
}

function transformCard(apiCard: PokemonTCGAPICard): PokemonCard {
  return {
    id: apiCard.id,
    name: apiCard.name,
    hp: apiCard.hp ? parseInt(apiCard.hp, 10) : undefined,
    image: apiCard.images.large,
    attacks: apiCard.attacks?.map(attack => ({
      name: attack.name,
      cost: attack.cost,
      damage: attack.damage,
      effect: attack.text
    })),
    types: apiCard.types,
    rarity: apiCard.rarity,
    set: apiCard.set
  };
}

export async function getCardsForQuiz(): Promise<PokemonCard[]> {
  try {
    const query = 'supertype:Pokémon hp:[30 TO *] attacks.damage:[10 TO *]';
    const pageSize = 50;
    const randomPage = Math.floor(Math.random() * 10) + 1;

    const url = new URL(`${BASE_URL}/cards`);
    url.searchParams.append('q', query);
    url.searchParams.append('pageSize', pageSize.toString());
    url.searchParams.append('page', randomPage.toString());
    url.searchParams.append('orderBy', '-set.releaseDate');

    const response = await fetch(url.toString(), {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: PokemonTCGAPIResponse = await response.json();

    const validCards = data.data
      .filter(card => {
        if (!card.hp || !card.attacks || card.attacks.length === 0) return false;
        const hp = parseInt(card.hp, 10);
        if (hp <= 0) return false;

        const hasValidAttack = card.attacks.some(attack => {
          if (!attack.damage) return false;
          const damageMatch = attack.damage.match(/(\d+)/);
          return damageMatch && parseInt(damageMatch[1], 10) > 0;
        });

        return hasValidAttack;
      })
      .map(transformCard);

    if (validCards.length < 10) {
      throw new Error('Not enough valid cards found. Please try again.');
    }

    return validCards;
  } catch (error) {
    console.error('Error fetching cards from Pokemon TCG API:', error);
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
    throw new Error('Not enough valid cards available');
  }

  const shuffled = [...cardsWithAttacksAndHP].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
