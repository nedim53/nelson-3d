import debounce from 'lodash.debounce';
import type { DebouncedFunc } from 'lodash';

export function createDebouncedFunction<TArgs extends unknown[], TResult>(
  func: (...args: TArgs) => TResult,
  wait = 200
): DebouncedFunc<(...args: TArgs) => TResult> {
  return debounce(func, wait);
}

