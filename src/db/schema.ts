import { pgTable, uuid, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Standard audit columns shared by every table. `updated_at` auto-bumps on
// Drizzle-issued updates via $onUpdate.
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const wishlist = pgTable('wishlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  brand: text('brand'),
  price: numeric('price', { precision: 10, scale: 2, mode: 'number' }),
  currency: text('currency'),
  url: text('url').notNull(),
  imageUrl: text('image_url'),
  description: text('description'),
  ...timestamps,
});

export const insertWishlistSchema = createInsertSchema(wishlist);
export const selectWishlistSchema = createSelectSchema(wishlist);
export type NewWishlistItem = z.infer<typeof insertWishlistSchema>;
export type WishlistItem = z.infer<typeof selectWishlistSchema>;

export const profile = pgTable('profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(), // e.g. 'shoe', 'waist', 'shirt'
  value: text('value').notNull(), // e.g. '10', '32', 'm'
  unit: text('unit'), // e.g. 'us', 'in'; null when not applicable
  ...timestamps,
});

export const insertProfileSchema = createInsertSchema(profile);
export const selectProfileSchema = createSelectSchema(profile);
export type NewProfileEntry = z.infer<typeof insertProfileSchema>;
export type ProfileEntry = z.infer<typeof selectProfileSchema>;
