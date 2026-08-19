import { type GuardianTx, upsertGuardianTx } from '@/features/kids/guardian';
import { describe, expect, it } from 'vitest';

import { createFakeTx } from '../../helpers/fake-tx';

// Compile-time guard: if `createFakeTx().tx` fails the GuardianTx interface
// this line type-errors — the fake is the test surface.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _check: GuardianTx = createFakeTx().tx;
void _check;

const base = {
  name: 'Ibu Rina',
  phone: '081234567890',
  email: 'ibu@example.com',
  secondContactName: 'Bapak Budi',
  secondContactPhone: '081298765432',
};

describe('upsertGuardianTx — create', () => {
  it('menyimpan guardian baru dengan semua field, null dinormalisasi', async () => {
    const { tx, guardians } = createFakeTx();
    const r = await upsertGuardianTx(tx, base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/);
    const row = guardians.get(r.id);
    expect(row).toBeDefined();
    expect(row?.name).toBe('Ibu Rina');
    expect(row?.phone).toBe('081234567890');
    expect(row?.email).toBe('ibu@example.com');
    expect(row?.secondContactName).toBe('Bapak Budi');
    expect(row?.secondContactPhone).toBe('081298765432');
    expect(row?.deletedAt).toBeNull();
  });

  it('create dengan email kosong → null', async () => {
    const { tx, guardians } = createFakeTx();
    const r = await upsertGuardianTx(tx, { ...base, email: undefined });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(guardians.get(r.id)?.email).toBeNull();
  });

  it('konflik nomor telepon → phone-conflict, store tidak bertambah', async () => {
    const { tx, guardians } = createFakeTx();
    guardians.set('G1', {
      id: 'G1',
      phone: '081234567890',
      email: 'lain@example.com',
      deletedAt: null,
      secondContactName: null,
      secondContactPhone: null,
    });
    const r = await upsertGuardianTx(tx, base);
    expect(r).toEqual({ ok: false, reason: 'phone-conflict' });
    expect(guardians.size).toBe(1);
  });

  it('konflik email → email-conflict', async () => {
    const { tx, guardians } = createFakeTx();
    guardians.set('G1', {
      id: 'G1',
      phone: '081111111111',
      email: 'ibu@example.com',
      deletedAt: null,
      secondContactName: null,
      secondContactPhone: null,
    });
    const r = await upsertGuardianTx(tx, base);
    expect(r).toEqual({ ok: false, reason: 'email-conflict' });
    expect(guardians.size).toBe(1);
  });

  it('guardian soft-deleted diabaikan untuk konflik', async () => {
    const { tx, guardians } = createFakeTx();
    guardians.set('G1', {
      id: 'G1',
      phone: '081234567890',
      email: 'lama@example.com',
      deletedAt: new Date('2026-01-01'),
      secondContactName: null,
      secondContactPhone: null,
    });
    const r = await upsertGuardianTx(tx, base);
    expect(r.ok).toBe(true);
    expect(guardians.size).toBe(2);
  });
});

describe('upsertGuardianTx — update', () => {
  it('update sukses: row di-merge, id tetap', async () => {
    const { tx, guardians } = createFakeTx();
    guardians.set('G', {
      id: 'G',
      phone: '081234567890',
      email: null,
      deletedAt: null,
      secondContactName: null,
      secondContactPhone: null,
    });
    const r = await upsertGuardianTx(tx, base, { existingGuardianId: 'G' });
    expect(r).toEqual({ ok: true, id: 'G' });
    expect(guardians.get('G')).toMatchObject({
      phone: '081234567890',
      email: 'ibu@example.com',
      name: 'Ibu Rina',
    });
  });

  it('update dengan phone sama → self-match diizinkan', async () => {
    const { tx, guardians } = createFakeTx();
    guardians.set('G', {
      id: 'G',
      phone: '081234567890',
      email: null,
      deletedAt: null,
      secondContactName: null,
      secondContactPhone: null,
    });
    const r = await upsertGuardianTx(tx, base, { existingGuardianId: 'G' });
    expect(r).toEqual({ ok: true, id: 'G' });
  });

  it('update id tidak ada → not-found', async () => {
    const { tx } = createFakeTx();
    const r = await upsertGuardianTx(tx, base, {
      existingGuardianId: 'HILANG',
    });
    expect(r).toEqual({ ok: false, reason: 'not-found' });
  });

  it('update phone bentrok dengan guardian lain → phone-conflict, row G1 tidak berubah', async () => {
    const { tx, guardians } = createFakeTx();
    guardians.set('G1', {
      id: 'G1',
      phone: '081299999999',
      email: null,
      deletedAt: null,
      name: 'Ibu Asli',
      secondContactName: null,
      secondContactPhone: null,
    });
    guardians.set('G2', {
      id: 'G2',
      phone: base.phone,
      email: 'g2@example.com',
      deletedAt: null,
      secondContactName: null,
      secondContactPhone: null,
    });
    const r = await upsertGuardianTx(tx, base, { existingGuardianId: 'G1' });
    expect(r).toEqual({ ok: false, reason: 'phone-conflict' });
    expect(guardians.get('G1')).toMatchObject({
      phone: '081299999999',
      name: 'Ibu Asli',
    });
  });

  it('update email bentrok dengan guardian lain → email-conflict, row G1 tidak berubah', async () => {
    const { tx, guardians } = createFakeTx();
    guardians.set('G1', {
      id: 'G1',
      phone: '081299999999',
      email: null,
      deletedAt: null,
      name: 'Ibu Asli',
      secondContactName: null,
      secondContactPhone: null,
    });
    guardians.set('G2', {
      id: 'G2',
      phone: '081111111111',
      email: base.email,
      deletedAt: null,
      secondContactName: null,
      secondContactPhone: null,
    });
    const r = await upsertGuardianTx(tx, base, { existingGuardianId: 'G1' });
    expect(r).toEqual({ ok: false, reason: 'email-conflict' });
    expect(guardians.get('G1')).toMatchObject({
      phone: '081299999999',
      name: 'Ibu Asli',
    });
  });

  it('update email tetap sama → self-match email diizinkan', async () => {
    const { tx, guardians } = createFakeTx();
    guardians.set('G', {
      id: 'G',
      phone: '081234567890',
      email: 'ibu@example.com',
      deletedAt: null,
      secondContactName: null,
      secondContactPhone: null,
    });
    const r = await upsertGuardianTx(tx, base, { existingGuardianId: 'G' });
    expect(r).toEqual({ ok: true, id: 'G' });
  });
});
