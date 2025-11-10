import debounce from 'lodash.debounce';
import type { DebouncedFunc } from 'lodash';

export function createDebouncedFunction<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait = 200
): DebouncedFunc<T> {
  return debounce(func, wait);
}

