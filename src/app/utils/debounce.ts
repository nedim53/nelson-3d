import debounce from 'lodash.debounce';

export function createDebouncedFunction<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 200
): T {
  return debounce(func, wait) as T;
}

