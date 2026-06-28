import { pgTable, uuid, text, numeric, timestamp } from 'drizzle-orm/pg-core';

export const wishlist = pgTable('wishlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  brand: text('brand'),
  price: numeric('price', { precision: 10, scale: 2, mode: 'number' }),
  currency: text('currency'),
  url: text('url').notNull(),
  imageUrl: text('image_url'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type WishlistItem = typeof wishlist.$inferSelect;
export type NewWishlistItem = typeof wishlist.$inferInsert;
