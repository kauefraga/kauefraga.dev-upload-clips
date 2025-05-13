import { boolean, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  isAdmin: boolean().notNull(),
  createdAt: timestamp().notNull().defaultNow()
});

export const sessionsTable = pgTable("sessions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid().notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  keepSignedIn: boolean().notNull().default(false),
  createdAt: timestamp().notNull().defaultNow(),
});

export const clipsTable = pgTable("clips", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  title: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 255 }),
  bucketUrl: text().notNull(),
  mimeType: varchar({ length: 64 }).notNull().default('video/mp4'),
  /** file size in bytes */
  size: integer().notNull(),
  status: varchar({ length: 255, enum: ['not_uploaded', 'in_progress', 'uploaded'] }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});
