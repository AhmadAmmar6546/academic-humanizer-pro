import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('Set DATABASE_URL securely before initializing the PostgreSQL database.');
  process.exitCode = 1;
} else {
  try {
    const source = await readFile(new URL('../db/postgres.sql', import.meta.url), 'utf8');
    const statements = source.split(';').map((statement) => statement.trim()).filter(Boolean);
    const sql = neon(process.env.DATABASE_URL);
    await sql.transaction(statements.map((statement) => sql.query(statement)));
    console.log('Revision history and rate-limit tables and indexes are ready.');
  } catch {
    // Provider error text can contain connection details; never print credentials.
    console.error('Database initialization failed. Check DATABASE_URL, database availability, and schema permissions.');
    process.exitCode = 1;
  }
}
