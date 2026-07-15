import type { SearchResult } from '../types';

function formatPrice(price: number | null, currency: string | null): string {
  if (price == null) return 'Price n/a';
  return `${price.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency ?? ''}`.trim();
}

// One product card — used for both search results and saved wishlist items;
// the caller supplies the action button (add vs remove).
export default function ItemCard({
  name,
  brand,
  price,
  currency,
  url,
  imageUrl,
  description,
  action,
}: SearchResult & { action: React.ReactNode }) {
  return (
    <article className="card">
      {imageUrl ? (
        <img src={imageUrl} alt={name} onError={(e) => (e.currentTarget.style.display = 'none')} />
      ) : (
        <div className="card-placeholder">No image</div>
      )}
      <div className="card-body">
        <h3>{name}</h3>
        <p className="meta">
          {brand ?? 'Unknown brand'} · {formatPrice(price, currency)}
        </p>
        {description && <p className="description">{description}</p>}
        <div className="card-actions">
          <a href={url} target="_blank" rel="noreferrer">
            View product
          </a>
          {action}
        </div>
      </div>
    </article>
  );
}
