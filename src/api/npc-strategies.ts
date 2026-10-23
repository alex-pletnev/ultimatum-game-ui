import type { NpcParams, NpcStrategy } from './types';

export const NPC_STRATEGIES: Array<{ value: NpcStrategy; title: string; hint: string }> = [
  {
    value: 'FAIR',
    title: 'Справедливый',
    hint: 'Предлагает половину. Принимает предложения не ниже заданной доли.',
  },
  {
    value: 'SELFISH',
    title: 'Экономный',
    hint: 'Отдаёт минимум, но принимает любую положительную сумму.',
  },
  {
    value: 'RANDOM',
    title: 'Непредсказуемый',
    hint: 'Предлагает случайную сумму и случайно принимает решения.',
  },
  {
    value: 'VENGEFUL',
    title: 'Злопамятный',
    hint: 'Помнит отказы и уменьшает следующие предложения.',
  },
  {
    value: 'ADAPTIVE',
    title: 'Гибкий',
    hint: 'Меняет предложения в зависимости от прошлых ответов.',
  },
];

export function defaultNpcParams(strategy: NpcStrategy): NpcParams {
  switch (strategy) {
    case 'FAIR':
      return { type: 'FAIR', fairnessThreshold: 0.3 };
    case 'SELFISH':
      return { type: 'SELFISH', minOffer: 0 };
    case 'RANDOM':
      return { type: 'RANDOM', acceptProbability: 0.5 };
    case 'VENGEFUL':
      return { type: 'VENGEFUL', baselineFraction: 0.5, punishStep: 1, fairnessThreshold: 0.3 };
    case 'ADAPTIVE':
      return { type: 'ADAPTIVE', baselineFraction: 0.5, targetRejectRate: 0.2, slope: 0.5 };
  }
}
