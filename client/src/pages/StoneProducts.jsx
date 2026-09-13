import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import { STONE_PRODUCTS, SITE } from '../data/siteContent.js';
import { usePageMeta } from '../lib/usePageMeta.js';
import { stones as catalogue } from '../data/stonesFallback.js';

export default function StoneProducts() {
  usePageMeta(
    `Stone Products | Blocks, Slabs, Steps & Carved Stone — ${SITE.name}`,
    `Stone and mineral products from ${SITE.legalName}: blocks, slabs, tiles, steps, pebbles, cobblestones, columns, carved and CNC-milled work, plus industrial minerals in bulk.`
  );

  return (
    <>
      <PageHeader title="Stone Products" crumbs={[{ label: 'Stone Products' }]} />

      <section className="products">
        <div className="container">
          <SectionTitle kicker="made to your specification" title="Stone Products">
            <p className="section-title__text">
              From quarry-fresh blocks to finished tiles, steps and carved work &mdash; plus the industrial
              minerals we trade in bulk. Tell us the sizes and finishes you need and we will quote against them.
            </p>
          </SectionTitle>

          <div className="products__grid">
            {STONE_PRODUCTS.map((product) => (
              <article key={product.title} className="product-card">
                <h3 className="product-card__title">{product.title}</h3>
                <p className="product-card__text">{product.text}</p>
                <Link to="/contact" className="product-card__link">
                  Enquire <Icon name="arrowRight" size={14} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="products-materials">
        <div className="container">
          <SectionTitle align="left" kicker="available in" title="Every stone in our range" />
          <ul className="materials__list list-unstyled">
            {catalogue.map((stone) => (
              <li key={stone.slug}>
                <Link to={`/stone-range/${stone.slug}`}>
                  {stone.name}
                  <Icon name="arrowRight" size={14} />
                </Link>
              </li>
            ))}
          </ul>

          <div className="products__actions">
            <Link to="/contact" className="thm-btn">
              Get a Quote
            </Link>
            <a href={SITE.phoneHref} className="thm-btn thm-btn--outline">
              <Icon name="phone" size={15} /> {SITE.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
