import { Link } from 'react-router-dom';
import { IMAGES } from '../lib/assets.js';

/**
 * Inner-page hero: background photo with an inset frame, uppercase title and
 * breadcrumb, matching `.page-header` from the original template.
 */
export function PageHeader({ title, crumbs = [] }) {
  return (
    <section className="page-header" style={{ backgroundImage: `url(${IMAGES.pageHeaderBg})` }}>
      <span className="page-header__overlay" aria-hidden="true" />
      <span className="page-header__frame" aria-hidden="true" />
      <div className="container">
        <div className="page-header__inner">
          <h1>{title}</h1>
          <ul className="thm-breadcrumb list-unstyled">
            <li>
              <Link to="/">Home</Link>
            </li>
            {crumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`}>
                <span>/</span>
                {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : crumb.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default PageHeader;
