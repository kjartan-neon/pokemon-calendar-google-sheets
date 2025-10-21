import type { PokemonCard, Attack, QuizQuestion } from '../types';

function parseDamage(damageString?: string): number {
  if (!damageString) return 0;

  const match = damageString.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function getValidAttack(card: PokemonCard): Attack | null {
  if (!card.attacks || card.attacks.length === 0) return null;

  const attacksWithDamage = card.attacks.filter(attack => {
    const damage = parseDamage(attack.damage);
    return damage > 0;
  });

  if (attacksWithDamage.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * attacksWithDamage.length);
  return attacksWithDamage[randomIndex];
}

function calculateHitsNeeded(attackDamage: number, defenderHP: number): number {
  return Math.ceil(defenderHP / attackDamage);
}

function generateAnswerOptions(correctAnswer: number): number[] {
  const options = new Set<number>([correctAnswer]);

  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 3) + 1;
    const shouldAdd = Math.random() > 0.5;

    if (shouldAdd) {
      options.add(correctAnswer + offset);
    } else {
      const newValue = correctAnswer - offset;
      if (newValue > 0) {
        options.add(newValue);
      }
    }
  }

  return Array.from(options).sort((a, b) => a - b);
}

export function generateQuizQuestion(cards: PokemonCard[]): QuizQuestion | null {
  if (cards.length < 2) {
    return null;
  }

  const [attackerCard, defenderCard] = cards;

  const selectedAttack = getValidAttack(attackerCard);
  if (!selectedAttack) {
    return null;
  }

  if (!defenderCard.hp || defenderCard.hp <= 0) {
    return null;
  }

  const attackDamage = parseDamage(selectedAttack.damage);
  if (attackDamage <= 0) {
    return null;
  }

  const correctAnswer = calculateHitsNeeded(attackDamage, defenderCard.hp);
  const options = generateAnswerOptions(correctAnswer);

  return {
    attackerCard,
    defenderCard,
    selectedAttack,
    correctAnswer,
    options
  };
}

export function checkAnswer(question: QuizQuestion, userAnswer: number): boolean {
  return userAnswer === question.correctAnswer;
}
