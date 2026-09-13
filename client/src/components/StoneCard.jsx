import { Link } from 'react-router-dom';
import { asset } from '../lib/assets.js';

/**
 * Stone range card.
 * Mirrors `.team-one__single` from the original: a white padded frame around the
 * photo, with the image scaling slightly and an inset rule appearing on hover.
 */
export function StoneCard({ stone, delay = 0 }) {
  return (
    <div className="col-xl-4 col-lg-6 col-md-6">
      <div className="stone-card" style={{ animationDelay: `${delay}ms` }}>
        <div className="stone-card__frame">
          <Link to={`/stone-range/${stone.slug}`} aria-label={stone.name}>
            <div className="stone-card__img">
              <img src={asset(stone.image)} alt={stone.name} loading="lazy" />
              <span className="stone-card__overlay" aria-hidden="true" />
            </div>
          </Link>
        </div>
        <div className="stone-card__content">
          <h3 className="stone-card__name">
            <Link to={`/stone-range/${stone.slug}`}>{stone.name}</Link>
          </h3>
          <p className="stone-card__title">{stone.tagline || 'Komal Minerals Supplier'}</p>
        </div>
      </div>
    </div>
  );
}

export default StoneCard;
