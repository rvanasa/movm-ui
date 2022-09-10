import { useEffect } from 'react';

export default function useTimeout<T extends any[]>(
  callback?: ((args: void) => void) | undefined | null | false,
  ms?: number,
  ...args: T
) {
  useEffect(() => {
    if (callback) {
      const id = setTimeout(callback, ms, ...args);
      return () => clearTimeout(id);
    }
  });
}
