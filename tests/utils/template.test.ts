import { describe, expect, it } from 'vitest';

import { renderTemplate } from '@/utils/template';

describe('renderTemplate', () => {
  it('replaces simple placeholders', () => {
    const result = renderTemplate('Halo {{name}}!', { name: 'Ahmad' });
    expect(result).toBe('Halo Ahmad!');
  });

  it('replaces multiple placeholders', () => {
    const result = renderTemplate('{{greeting}} {{name}}!', {
      greeting: 'Halo',
      name: 'Ahmad',
    });
    expect(result).toBe('Halo Ahmad!');
  });

  it('replaces missing placeholder with empty string', () => {
    const result = renderTemplate('Halo {{name}}!', {});
    expect(result).toBe('Halo !');
  });

  it('handles {{#if}} conditional with truthy value', () => {
    const result = renderTemplate('Halo{{#if notes}} {{notes}}{{/if}}.', {
      notes: 'test',
    });
    // cleanseText capitalizes and appends period
    expect(result).toBe('Halo Test..');
  });

  it('handles {{#if}} conditional with falsy value', () => {
    const result = renderTemplate('Halo{{#if notes}} {{notes}}{{/if}}.', {
      notes: '',
    });
    expect(result).toBe('Halo.');
  });

  it('handles {{#if}} conditional with null value', () => {
    const result = renderTemplate('Halo{{#if notes}} {{notes}}{{/if}}.', {
      notes: null,
    });
    expect(result).toBe('Halo.');
  });

  it('cleanses description before substitution', () => {
    const result = renderTemplate('{{description}}', {
      description: '  anak belajar mewarnai  ',
    });
    expect(result).toBe('Anak belajar mewarnai.');
  });

  it('cleanses notes before substitution', () => {
    const result = renderTemplate('{{notes}}', {
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

    const result = renderTemplate(template, data);
    expect(result).toContain('Assalamualaikum Bunda Ahmad');
    expect(result).toContain('Anak belajar mengenal binatang.');
    expect(result).toContain('😄 Senang');
    expect(result).toContain('🍱 Banyak');
    expect(result).not.toContain('Catatan:');
  });
});
