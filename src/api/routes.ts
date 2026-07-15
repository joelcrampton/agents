import { Router } from 'express';
import { z } from 'zod';
import { clothingItemSchema } from '../agent/wishlistAgent.js';
import {
  PROFILE_FIELDS,
  deleteProfileEntry,
  getProfile,
  setProfileEntry,
} from '../services/profile.js';
import { searchClothing } from '../services/search.js';
import { addItem, listItems, removeItem } from '../services/wishlist.js';

// HTTP layer only: validate input, call the service, shape the response.
export const routes = Router();

// List every saved item, newest first.
routes.get('/wishlist', async (_req, res) => {
  res.json(await listItems());
});

// Run the agent search and return candidate items for the user to pick from.
routes.post('/search', async (req, res) => {
  const parsed = z.object({ query: z.string().trim().min(1) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'A non-empty "query" string is required.' });
    return;
  }

  res.json(await searchClothing(parsed.data.query));
});

// Save a picked item to the wishlist.
routes.post('/wishlist', async (req, res) => {
  const parsed = clothingItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid wishlist item.', issues: parsed.error.issues });
    return;
  }

  res.status(201).json(await addItem(parsed.data));
});

// Read the stored sizes.
routes.get('/profile', async (_req, res) => {
  res.json(await getProfile());
});

const profileKeys = PROFILE_FIELDS.map((f) => f.key);

// Set or clear sizes. An empty value clears that field. Returns the full profile.
routes.put('/profile', async (req, res) => {
  const parsed = z
    .object({
      entries: z
        .array(z.object({ key: z.enum(profileKeys), value: z.string().trim() }))
        .min(1),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: `"entries" must be a non-empty array of { key: ${profileKeys.join(' | ')}, value: string }.`,
    });
    return;
  }

  for (const { key, value } of parsed.data.entries) {
    if (value === '') {
      await deleteProfileEntry(key);
    } else {
      await setProfileEntry(key, value);
    }
  }

  res.json(await getProfile());
});

// Remove a single item by id.
routes.delete('/wishlist/:id', async (req, res) => {
  const { id } = req.params;
  if (!z.uuid().safeParse(id).success) {
    res.status(400).json({ error: `Invalid id: ${id}` });
    return;
  }

  const row = await removeItem(id);
  if (!row) {
    res.status(404).json({ error: `No wishlist item found with id: ${id}` });
    return;
  }

  res.json(row);
});
