import { useMutation } from '@tanstack/react-query';
import { useActor } from './useActor';

export type Operation = 'add' | 'subtract' | 'multiply' | 'divide';

export interface CalcInput {
  operation: Operation;
  x: number;
  y: number;
}

export function useCalculate() {
  const { actor } = useActor();

  return useMutation<number, Error, CalcInput>({
    mutationFn: async ({ operation, x, y }: CalcInput) => {
      if (!actor) throw new Error('Calculator not ready');
      switch (operation) {
        case 'add':
          return actor.add(x, y);
        case 'subtract':
          return actor.subtract(x, y);
        case 'multiply':
          return actor.multiply(x, y);
        case 'divide':
          return actor.divide(x, y);
        default:
          throw new Error('Unknown operation');
      }
    },
  });
}
