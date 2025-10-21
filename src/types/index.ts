export interface PokemonCard {
  id: string;
  name: string;
  hp?: number;
  image: string;
  attacks?: Attack[];
  types?: string[];
  rarity?: string;
  set?: {
    id: string;
    name: string;
  };
}

export interface Attack {
  name: string;
  cost?: string[];
  damage?: string;
  effect?: string;
}

export interface PokemonSet {
  id: string;
  name: string;
  logo?: string;
  cardCount?: {
    total: number;
  };
  releaseDate: string;
}

export interface QuizQuestion {
  attackerCard: PokemonCard;
  defenderCard: PokemonCard;
  selectedAttack: Attack;
  correctAnswer: number;
  options: number[];
}

export interface CollectedCard {
  id: string;
  name: string;
  image: string;
  hp?: number;
  types?: string[];
  rarity?: string;
  collectedAt: string;
}

export interface QuizStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

export interface Collection {
  cards: CollectedCard[];
  stats: QuizStats;
  version: string;
}
