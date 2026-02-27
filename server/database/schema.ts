import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// ─── Users ──────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // UUID
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  name: text('name'),
  appleId: text('apple_id').unique(),
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ─── Sessions ───────────────────────────────────────────────
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), // session token
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull(), // Unix timestamp
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ─── Todos (Demo) ───────────────────────────────────────────
export const todos = sqliteTable('todos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ─── Type helpers ───────────────────────────────────────────
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type Todo = typeof todos.$inferSelect
export type NewTodo = typeof todos.$inferInsert
