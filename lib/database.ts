import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

type Row = Record<string, unknown>;
export type QueryRunner = (query: string, values: unknown[]) => Promise<Row[]>;

/** Only application-owned SQL reaches this adapter; user values stay parameters. */
export function bindQuery(query: string, values: readonly unknown[]) {
  let index = 0;
  const text = query.replace(/\?/g, () => `$${++index}`);
  if (index !== values.length) throw new Error('Database parameter count mismatch.');
  return { text, values: [...values] };
}

function normalize(row: Row): Row {
  const result = { ...row };
  for (const key of ['created', 'expires', 'count']) {
    if (!(key in result)) continue;
    const value = result[key];
    if (typeof value !== 'number' && typeof value !== 'string' && typeof value !== 'bigint') {
      throw new Error('DATABASE_RESPONSE_INVALID');
    }
    if (typeof value === 'string' && !/^-?\d+$/.test(value)) {
      throw new Error('DATABASE_RESPONSE_INVALID');
    }
    const number = Number(value);
    if (!Number.isSafeInteger(number)) throw new Error('DATABASE_RESPONSE_INVALID');
    result[key] = number;
  }
  return result;
}

/** The small D1 statement interface used by the existing API routes. */
export function createDatabase(query: QueryRunner) {
  function statement(text: string, values: readonly unknown[] = []) {
    async function execute() {
      const bound = bindQuery(text, values);
      return (await query(bound.text, bound.values)).map(normalize);
    }
    return {
      bind(...parameters: unknown[]) {
        return statement(text, parameters);
      },
      async first<T = Row>(): Promise<T | null> {
        const rows = await execute();
        return (rows[0] as T | undefined) ?? null;
      },
      async all<T = Row>(): Promise<{ results: T[] }> {
        return { results: await execute() as T[] };
      },
      async run(): Promise<{ success: true }> {
        await execute();
        return { success: true };
      },
    };
  }
  return { prepare: (text: string) => statement(text) };
}

let cached: { url: string; database: ReturnType<typeof createDatabase> } | undefined;

export function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_UNAVAILABLE');
  if (!cached || cached.url !== url) {
    let sql: NeonQueryFunction<false, false>;
    try { sql = neon(url); } catch { throw new Error('DATABASE_UNAVAILABLE'); }
    cached = {
      url,
      database: createDatabase(async (text, values) => {
        try { return await sql.query(text, values); }
        catch { throw new Error('DATABASE_UNAVAILABLE'); }
      }),
    };
  }
  return cached.database;
}
