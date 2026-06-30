import { createInterface } from 'node:readline/promises';
import { db } from './db/index.js';
import { profile } from './db/schema.js';

// Profile fields we keep on file, each with its fixed unit.
export const PROFILE_FIELDS: { key: string; unit: string | null; label: string }[] = [
  { key: 'shoe', unit: 'us', label: 'shoe size' },
  { key: 'waist', unit: 'in', label: 'waist' },
  { key: 'shirt', unit: null, label: 'shirt size' },
];

// Prompt for any fields that aren't stored yet, then return the full profile as
// a single line for the agent's instructions (e.g. "shoe: 10 us, waist: 32 in").
export async function ensureProfile(): Promise<string> {
  let sizes = await db.select().from(profile);
  const missing = PROFILE_FIELDS.filter((f) => !sizes.some((s) => s.key === f.key));

  if (missing.length) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    console.log("Let's set up your profile (press Enter to skip a field).");
    for (const field of missing) {
      const hint = field.unit ? ` (${field.unit})` : '';
      const value = (await rl.question(`  ${field.label}${hint}: `)).trim();
      if (value) {
        await db.insert(profile).values({ key: field.key, value, unit: field.unit });
      }
    }
    rl.close();
    sizes = await db.select().from(profile); // refresh after saving
  }

  return sizes.length
    ? sizes.map((s) => `${s.key}: ${s.value}${s.unit ? ` ${s.unit}` : ''}`).join(', ')
    : 'none recorded';
}
