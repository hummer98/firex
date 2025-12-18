import { describe, it, expect } from 'vitest';
import { version } from './index';

describe('index', () => {
  it('should export version', () => {
    expect(version).toBe('0.1.0');
  });
});
