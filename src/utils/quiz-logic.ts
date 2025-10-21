import type { PokemonCard, QuizQuestion } from '../types';
import type { Translations } from '../i18n/translations';

function generateRandomMathQuestion(): { question: string; answer: number } {
  const num1 = Math.floor(Math.random() * 50) + 10;
  const num2 = Math.floor(Math.random() * 50) + 10;
  const operators = ['+', '-'];
  const operator = operators[Math.floor(Math.random() * operators.length)];

  let answer: number;
  let question: string;

  if (operator === '+') {
    answer = num1 + num2;
    question = `What is ${num1} + ${num2}?`;
  } else {
    answer = num1 + num2;
    const largerNum = answer;
    const smallerNum = num1;
    answer = smallerNum;
    question = `What is ${largerNum} - ${num2}?`;
  }

  return { question, answer };
}

export function generateQuizQuestion(card: PokemonCard, t: Translations): QuizQuestion | null {
  if (!card) return null;

  let questionText: string;
  let correctAnswer: number;
  let isPokemon = false;

  if (card.hp && card.hp > 0) {
    isPokemon = true;
    const damagePerTurn = [10, 20, 30, 40, 50, 60, 60 , 80, 120, 300][Math.floor(Math.random() * 5)];
    correctAnswer = Math.ceil(card.hp / damagePerTurn);
    questionText = t.damageQuestion(damagePerTurn);
  } else {
    const mathQ = generateRandomMathQuestion();
    questionText = mathQ.question;
    correctAnswer = mathQ.answer;
  }

  return {
    card,
    questionText,
    correctAnswer,
    isPokemon
  };
}

export function checkAnswer(question: QuizQuestion, userAnswer: number): boolean {
  return userAnswer === question.correctAnswer;
}
