import { createWishlistAgent } from '../agent/wishlistAgent.js';
import { getProfileText } from './profile.js';

// Run the agent search with the stored profile folded into its instructions.
export async function searchClothing(query: string) {
  const wishlistAgent = createWishlistAgent(await getProfileText());
  const { output } = await wishlistAgent.generate({ prompt: query });
  return output;
}
