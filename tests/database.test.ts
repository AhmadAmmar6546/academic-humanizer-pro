import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bindQuery, createDatabase } from '../lib/database';

test('SQL parameters remain separate from text, including malicious-looking values', () => {
  const owner = "someone'; DELETE FROM revisions; --";
  assert.deepEqual(bindQuery('SELECT id FROM revisions WHERE owner=? AND id=?', [owner, 'id']), {
    text: 'SELECT id FROM revisions WHERE owner=$1 AND id=$2',
    values: [owner, 'id'],
  });
  assert.throws(() => bindQuery('SELECT id FROM revisions WHERE owner=?', []), /parameter count mismatch/);
});

test('adapter normalizes PostgreSQL bigint timestamps and keeps text payload intact', async () => {
  const payload = '[{"text":"A saved revision"}]';
  const db = createDatabase(async (query, values) => {
    assert.equal(query, 'SELECT * FROM revisions WHERE id=$1 AND owner=$2');
    assert.deepEqual(values, ['revision', 'owner']);
    return [{ id: 'revision', payload, created: '1791620000000', expires: '1791706400000' }];
  });
  const row = await db.prepare('SELECT * FROM revisions WHERE id=? AND owner=?').bind('revision', 'owner').first();
  assert.deepEqual(row, { id: 'revision', payload, created: 1791620000000, expires: 1791706400000 });
});

test('rate-limit UPSERT remains a single atomic parameterized query', async () => {
  let calls = 0;
  const db = createDatabase(async (query, values) => {
    calls++;
    assert.equal(query, 'INSERT INTO limits(key,count,expires) VALUES($1,1,$2) ON CONFLICT(key) DO UPDATE SET count=limits.count+1 RETURNING count');
    assert.deepEqual(values, ['owner:123', 120000]);
    return [{ count: 21 }];
  });
  const result = await db.prepare('INSERT INTO limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=limits.count+1 RETURNING count').bind('owner:123', 120000).first<{ count: number }>();
  assert.equal(result?.count, 21);
  assert.equal(calls, 1);
});

test('empty results, all results, and non-returning mutations keep their API shapes', async () => {
  const db = createDatabase(async (query) => query === 'SELECT id FROM revisions' ? [{ id: 'revision' }] : []);
  assert.equal(await db.prepare('SELECT id FROM revisions WHERE id=?').bind('missing').first(), null);
  assert.deepEqual(await db.prepare('SELECT id FROM revisions').all(), { results: [{ id: 'revision' }] });
  assert.deepEqual(await db.prepare('DELETE FROM revisions WHERE owner=?').bind('owner').run(), { success: true });
});

test('timestamps outside the safe integer range are rejected', async () => {
  const db = createDatabase(async () => [{ created: '9007199254740992' }]);
  await assert.rejects(db.prepare('SELECT created FROM revisions').first(), /DATABASE_RESPONSE_INVALID/);
});
