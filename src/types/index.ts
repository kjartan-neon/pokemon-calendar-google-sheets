export interface PokemonCard {
  id: string;
  localId?: string;
  name: string;
  hp?: number;
  image: string;
  types?: string[];
  rarity?: string;
  set?: {
    id: string;
    name: string;
  };
}

export interface PokemonSet {
  id: string;
  name: string;
  logo?: string;
  cardCount?: {
    total: number;
  };
  releaseDate?: string;
  cards?: PokemonCard[];
}

export interface QuizQuestion {
  card: PokemonCard;
  questionText: string;
  correctAnswer: number;
  isPokemon: boolean;
  secondQuestion?: string;
  secondAnswer?: number;
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
  totalHpDefeated: number;
}

export interface Collection {
  cards: CollectedCard[];
  stats: QuizStats;
  version: string;
  currentStreak?: number;
  streakCard?: PokemonCard;
  unlockedRareSets?: { [setId: string]: boolean };
}
