import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const revisions = sqliteTable('revisions', {id:text('id').primaryKey(), owner:text('owner').notNull(), title:text('title').notNull(), payload:text('payload').notNull(), created:integer('created').notNull(), expires:integer('expires').notNull()});
export const limits = sqliteTable('limits',{key:text('key').primaryKey(), count:integer('count').notNull(), expires:integer('expires').notNull()});
