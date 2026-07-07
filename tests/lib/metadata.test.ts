import { describe, expect, it } from 'vitest';

import { baseMetadata } from '@/lib/metadata';

describe('baseMetadata', () => {
  it('has default title and description', () => {
    expect(baseMetadata.title).toBeDefined();
    expect(baseMetadata.description).toBeDefined();
  });

  it('has open graph configuration', () => {
    expect(baseMetadata.openGraph).toBeDefined();
  });

  it('has robots indexing enabled', () => {
    expect(baseMetadata.robots).toBeDefined();
    if (typeof baseMetadata.robots === 'object' && baseMetadata.robots !== null) {
      expect(baseMetadata.robots.index).toBe(true);
      expect(baseMetadata.robots.follow).toBe(true);
    }
  });

  it('has twitter card configuration', () => {
    expect(baseMetadata.twitter).toBeDefined();
  });
});
