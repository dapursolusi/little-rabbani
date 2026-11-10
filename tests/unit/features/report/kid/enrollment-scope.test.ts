import {
  findCsIdByTermId,
  findTermsByKid,
  hasKidEnrollment,
} from '@/features/kid-enrollment/repositories';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The month-eligibility and report-window lookups must never see a removed
 * enrollment or a soft-deleted term. A kid who moved class leaves a dead
 * enrollment row behind, and that row's class session would otherwise scope a
 * report to a class the kid no longer attends.
 *
 * These tests inspect the generated WHERE clause rather than query results —
 * the repository is a thin drizzle shell, and the defect is the missing filter.
 */

type Call = { where?: unknown; with?: Record<string, unknown> };

const calls = vi.hoisted(() => ({ captured: [] as Call[] }));

vi.mock('@/db', () => {
  const record = (args: Call) => {
    calls.captured.push(args);
    return Promise.resolve(args.with ? [] : undefined);
  };
  return {
    db: {
      query: {
        kidEnrollment: {
          findFirst: (args: Call) => record(args),
          findMany: (args: Call) => record(args),
        },
      },
    },
  };
});

const dialect = new PgDialect();
const whereSql = (call: Call) =>
  call.where ? dialect.sqlToQuery(call.where as never).sql : '';

describe('kid-enrollment report lookups exclude soft-deleted rows', () => {
  beforeEach(() => {
    calls.captured.length = 0;
  });

  it('hasKidEnrollment filters deleted enrollments', async () => {
    await hasKidEnrollment({ termId: 't1', kidId: 'k1' });
    expect(whereSql(calls.captured[0])).toContain(
      '"kid_enrollment"."deleted_at" is null'
    );
  });

  it('findCsIdByTermId filters deleted enrollments', async () => {
    await findCsIdByTermId({ termId: 't1', kidId: 'k1' });
    expect(whereSql(calls.captured[0])).toContain(
      '"kid_enrollment"."deleted_at" is null'
    );
  });

  it('findTermsByKid filters deleted terms in the term relation', async () => {
    await findTermsByKid('k1');
    const termRelation = calls.captured[0]?.with?.term as { where?: unknown };
    expect(termRelation?.where).toBeDefined();
    expect(dialect.sqlToQuery(termRelation.where as never).sql).toBe(
      '"term"."deleted_at" is null'
    );
  });
});
