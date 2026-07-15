import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { profile, type ProfileEntry } from '../db/schema.js';

// Profile fields we keep on file, each with its fixed unit.
export const PROFILE_FIELDS = [
  { key: 'shoe', unit: 'us', label: 'shoe size' },
  { key: 'waist', unit: 'in', label: 'waist' },
  { key: 'shirt', unit: null, label: 'shirt size' },
] as const;

export type ProfileKey = (typeof PROFILE_FIELDS)[number]['key'];

export async function getProfile(): Promise<ProfileEntry[]> {
  return db.select().from(profile);
}

// Insert or update a single size; the unit is fixed per field, never client-set.
export async function setProfileEntry(key: ProfileKey, value: string): Promise<void> {
  const unit = PROFILE_FIELDS.find((f) => f.key === key)?.unit ?? null;
  await db
    .insert(profile)
    .values({ key, value, unit })
    .onConflictDoUpdate({
      target: profile.key,
      set: { value, unit, updatedAt: new Date() },
    });
}

export async function deleteProfileEntry(key: ProfileKey): Promise<void> {
  await db.delete(profile).where(eq(profile.key, key));
}

// Format stored sizes as a single line for the agent's instructions
// (e.g. "shoe: 10 us, waist: 32 in").
export function formatProfile(sizes: ProfileEntry[]): string {
  return sizes.length
    ? sizes.map((s) => `${s.key}: ${s.value}${s.unit ? ` ${s.unit}` : ''}`).join(', ')
    : 'none recorded';
}

export async function getProfileText(): Promise<string> {
  return formatProfile(await getProfile());
}
