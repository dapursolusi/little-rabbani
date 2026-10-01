import { describe, expect, it } from 'vitest';

import { expandTemplate } from '@/utils/template';

describe('expandTemplate', () => {
  it('replaces simple placeholders', () => {
    const result = expandTemplate('Halo {{name}}!', { name: 'Ahmad' });
    expect(result).toBe('Halo Ahmad!');
  });

  it('replaces multiple placeholders', () => {
    const result = expandTemplate('{{greeting}} {{name}}!', {
      greeting: 'Halo',
      name: 'Ahmad',
    });
    expect(result).toBe('Halo Ahmad!');
  });

  it('replaces missing placeholder with empty string', () => {
    const result = expandTemplate('Halo {{name}}!', {});
    expect(result).toBe('Halo !');
  });

  it('handles {{#if}} conditional with truthy value', () => {
    const result = expandTemplate('Halo{{#if notes}} {{notes}}{{/if}}.', {
      notes: 'test',
    });
    // cleanseText capitalizes and appends period
    expect(result).toBe('Halo Test..');
  });

  it('handles {{#if}} conditional with falsy value', () => {
    const result = expandTemplate('Halo{{#if notes}} {{notes}}{{/if}}.', {
      notes: '',
    });
    expect(result).toBe('Halo.');
  });

  it('handles {{#if}} conditional with null value', () => {
    const result = expandTemplate('Halo{{#if notes}} {{notes}}{{/if}}.', {
      notes: null,
    });
    expect(result).toBe('Halo.');
  });

  it('cleanses description before substitution', () => {
    const result = expandTemplate('{{description}}', {
      description: '  anak belajar mewarnai  ',
    });
    expect(result).toBe('Anak belajar mewarnai.');
  });

  it('cleanses notes before substitution', () => {
    const result = expandTemplate('{{notes}}', {
      notes: '  ahmad sangat antusias  ',
    });
    expect(result).toBe('Ahmad sangat antusias.');
  });

  it('handles realistic template', () => {
    const template = `Assalamualaikum Bunda {{nickName}}

{{description}}

📋 Ringkasan:
• Mood: {{mood}}
• Makan: {{appetite}}

{{#if notes}}📝 Catatan:
{{notes}}{{/if}}

Terima kasih.`;

    const data = {
      nickName: 'Ahmad',
      description: 'anak belajar mengenal binatang',
      mood: '😄 Senang',
      appetite: '🍱 Banyak',
      notes: '',
    };

    const result = expandTemplate(template, data);
    expect(result).toContain('Assalamualaikum Bunda Ahmad');
    expect(result).toContain('Anak belajar mengenal binatang.');
    expect(result).toContain('😄 Senang');
    expect(result).toContain('🍱 Banyak');
    expect(result).not.toContain('Catatan:');
  });
});
