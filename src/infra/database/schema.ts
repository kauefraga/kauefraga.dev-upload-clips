import { boolean, integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

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
