import {
  Column,
  Param,
  SQL,
  StringChunk,
  type SQL as SQLType,
} from 'drizzle-orm';
import { guardian } from '@/db/schema';
import type { GuardianTx } from '@/features/kids/guardian';

export type GuardianRow = {
  id: string;
  phone: string;
  email: string | null;
  deletedAt: Date | null;
  name?: string;
  secondContactName: string | null;
  secondContactPhone: string | null;
};

/**
 * Evaluate a drizzle SQL condition tree against one row. Understands only the
 * shapes the guardian seam produces: `and(eq/ne/isNull/isNotNull, ...)` built
 * on `sql`${left} = ${right}``. Traverses `queryChunks` recursively:
 * StringChunk separators (`" and "`, `" or "`) compose children, an operator
 * string (`" ="`, `" <>"`, `" is null"`, `" is not null"`) applies to the
 * preceding Column/Param pair. `Column.name` is the JS prop key (verified:
 * `keyAsName` false means `.name` = DB name, but `Object.keys(guardian)` gives
 * prop keys and chunk Column instances are the table's own columns).
 */
function evalWhere(sql: SQLType<unknown>, row: GuardianRow): boolean {
  return evalChunks(sql.queryChunks, row);
}

function evalChunks(chunks: unknown[], row: GuardianRow): boolean {
  if (chunks.length === 1 && chunks[0] instanceof SQL) {
    return evalChunks((chunks[0] as SQLType<unknown>).queryChunks, row);
  }
  // Split into operand SQL nodes joined by StringChunk separators.
  const operands: SQLType<unknown>[] = [];
  let joiner = 'and';
  let sawJoiner = false;
  for (const chunk of chunks) {
    if (chunk instanceof StringChunk) {
      const joined = (chunk.value as string[]).join('');
      if (joined.includes(' and ')) {
        joiner = 'and';
        sawJoiner = true;
      } else if (joined.includes(' or ')) {
        joiner = 'or';
        sawJoiner = true;
      }
    } else if (chunk instanceof SQL) {
      operands.push(chunk);
    }
  }
  if (sawJoiner) {
    if (operands.length === 0) return false;
    const results = operands.map((c) => evalChunks(c.queryChunks, row));
    return joiner === 'or' ? results.some(Boolean) : results.every(Boolean);
  }
  if (operands.length === 1) return evalChunks(operands[0].queryChunks, row);
  return evalAtomic(chunks, row);
}

function evalAtomic(chunks: unknown[], row: GuardianRow): boolean {
  let colName: string | undefined;
  let paramValue: unknown;
  let operator = '';
  for (const chunk of chunks) {
    if (chunk instanceof Column) {
      colName = colKey(chunk);
    } else if (chunk instanceof Param) {
      paramValue = chunk.value;
    } else if (chunk instanceof StringChunk) {
      operator += (chunk.value as string[]).join('');
    }
  }
  if (colName === undefined) return false;
  const actual = row[colName as keyof GuardianRow];
  if (operator.includes(' is null')) return actual == null;
  if (operator.includes(' is not null')) return actual != null;
  if (operator.includes(' <>')) return actual !== paramValue;
  if (operator.includes(' =')) return actual === paramValue;
  return false;
}

/** Map a Column instance to its JS prop key on the store row. */
function colKey(col: Column): string {
  for (const [key, candidate] of Object.entries(guardian)) {
    if (candidate === col) return key;
  }
  return col.name;
}

export { evalWhere };

/**
 * In-memory fake transaction exposing only the narrow `GuardianTx` surface:
 * `query.guardian.findFirst`, `insert(...).values(...).returning()`, and
 * `update(...).set(...).where(...).returning()`. Rows live in the returned
 * `guardians` Map for assertions.
 */
export function createFakeTx() {
  const guardians = new Map<string, GuardianRow>();

  const tx: GuardianTx = {
    query: {
      guardian: {
        async findFirst({ where }) {
          if (where === undefined) return undefined;
          for (const row of guardians.values()) {
            if (evalWhere(where, row)) return row;
          }
          return undefined;
        },
      },
    },
    insert: (_table: typeof guardian) => ({
      values: (values: unknown) => {
        const v = values as Record<string, string | null>;
        const row: GuardianRow = {
          id: crypto.randomUUID(),
          phone: v.phone ?? '',
          email: v.email ?? null,
          deletedAt: null,
          name: v.name ?? '',
          secondContactName: v.secondContactName ?? null,
          secondContactPhone: v.secondContactPhone ?? null,
        };
        guardians.set(row.id, row);
        return {
          async returning() {
            return [{ id: row.id }];
          },
        };
      },
    }),
    update: (_table: typeof guardian) => ({
      set: (values: unknown) => ({
        where: (cond: SQLType<unknown>) => ({
          async returning() {
            const v = values as Record<string, string | null>;
            for (const row of guardians.values()) {
              if (!evalWhere(cond, row)) continue;
              for (const [key, value] of Object.entries(v)) {
                row[key as keyof GuardianRow] = value as never;
              }
              return [{ id: row.id }];
            }
            return [];
          },
        }),
      }),
    }),
  };

  return { tx, guardians };
}
