import type { PokemonCard, QuizQuestion } from '../types';
import type { Translations } from '../i18n/translations';

function generateRandomMathQuestion(t: Translations): { question: string; answer: number } {
  const num1 = Math.floor(Math.random() * 50) + 10;
  const num2 = Math.floor(Math.random() * 50) + 10;
  const operators: Array<'+' | '-'> = ['+', '-'];
  const operator = operators[Math.floor(Math.random() * operators.length)];

  let answer: number;
  let question: string;

  if (operator === '+') {
    answer = num1 + num2;
    question = t.mathQuestion(num1, num2, '+');
  } else {
    answer = num1 + num2;
    const largerNum = answer;
    const smallerNum = num1;
    answer = smallerNum;
    question = t.mathQuestion(largerNum, num2, '-');
  }

  return { question, answer };
}

function generateAdditionQuestion(t: Translations): { question: string; answer: number } {
  const num1 = Math.floor(Math.random() * 50) + 10;
  const num2 = Math.floor(Math.random() * 50) + 10;
  const answer = num1 + num2;
  const question = t.mathQuestion(num1, num2, '+');
  return { question, answer };
}

export function generateQuizQuestion(card: PokemonCard, t: Translations, isRareCard: boolean = false): QuizQuestion | null {
  if (!card) return null;

  let questionText: string;
  let correctAnswer: number;
  let isPokemon = false;
  let secondQuestion: string | undefined;
  let secondAnswer: number | undefined;

  if (card.hp && card.hp > 0) {
    isPokemon = true;
    const damagePerTurn = [10, 20, 30, 40, 50, 60, 60 , 80, 120, 300][Math.floor(Math.random() * 5)];
    correctAnswer = Math.ceil(card.hp / damagePerTurn);
    questionText = t.damageQuestion(damagePerTurn);
  } else {
    const mathQ = generateRandomMathQuestion(t);
    questionText = mathQ.question;
    correctAnswer = mathQ.answer;
  }

  if (isRareCard) {
    const additionQ = generateAdditionQuestion(t);
    secondQuestion = additionQ.question;
    secondAnswer = additionQ.answer;
  }

  return {
    card,
    questionText,
    correctAnswer,
    isPokemon,
    secondQuestion,
    secondAnswer
  };
}

export function checkAnswer(question: QuizQuestion, userAnswer: number, secondUserAnswer?: number): boolean {
  const firstCorrect = userAnswer === question.correctAnswer;
  if (question.secondQuestion && question.secondAnswer !== undefined) {
    const secondCorrect = secondUserAnswer === question.secondAnswer;
    return firstCorrect && secondCorrect;
  }
  return firstCorrect;
}
