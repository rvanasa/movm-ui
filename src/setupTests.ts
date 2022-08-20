import { expect, vi } from 'vitest';
import matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// global.fetch = async () => null as any as Response;

vi.doMock('./rust.ts', () => {
  return {
    default: {},
  };
});
