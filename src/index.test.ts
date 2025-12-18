import { describe, it, expect } from 'vitest';
import { version } from './index';
import packageJson from '../package.json';

describe('index', () => {
  it('should export version matching package.json', () => {
    expect(version).toBe(packageJson.version);
  });
});
