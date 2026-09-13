import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import BrandMark from './BrandMark.jsx';
import { IMAGES } from '../lib/assets.js';
import { FOOTER_LINKS, FOOTER_TEXT, SITE } from '../data/siteContent.js';
import { stones as catalogue } from '../data/stonesFallback.js';

export function Footer({ exploreLinks = catalogue.slice(0, 6) }) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="container">
          <div className="site-footer__top-inner">
            <div className="site-footer__top-logo-box">
              <BrandMark light />
            </div>
            <p className="site-footer__top-text">
              Marble, granite and minerals from Makrana, Rajasthan &mdash; supplied across India since {SITE.since}.
            </p>
          </div>
        </div>
      </div>

      <div className="site-footer__main">
        <div
          className="site-footer__pattern"
          style={{ backgroundImage: `url(${IMAGES.footerPattern})` }}
          aria-hidden="true"
        />
        <div className="container">
          <div className="footer-grid">
            <div className="footer-widget footer-widget--about">
              <h3 className="footer-widget__title">About Us</h3>
              <p className="footer-widget__text">{FOOTER_TEXT}</p>
              <p className="footer-widget__gst">
                <strong>GST No.</strong> {SITE.gst}
              </p>
            </div>

            <div className="footer-widget">
              <h3 className="footer-widget__title">Links</h3>
              <ul className="footer-widget__list list-unstyled">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-widget">
              <h3 className="footer-widget__title">Explore</h3>
              <ul className="footer-widget__list list-unstyled">
                {exploreLinks.map((stone) => (
                  <li key={stone.slug}>
                    <Link to={`/stone-range/${stone.slug}`}>{stone.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-widget footer-widget--connect">
              <h3 className="footer-widget__title">Lets Connect</h3>

              {SITE.socials.length ? (
                <div className="site-footer__social">
                  {SITE.socials.map((social) => (
                    <a
                      key={social.href}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                    >
                      <Icon name={social.icon} size={16} />
                    </a>
                  ))}
                </div>
              ) : null}

              <ul className="footer-widget__contact list-unstyled">
                {SITE.phones.map((phone) => (
                  <li key={phone.href}>
                    <span className="icon">
                      <Icon name="phone" size={15} />
                    </span>
                    <a href={phone.href}>{phone.label}</a>
                  </li>
                ))}

                <li>
                  <span className="icon">
                    <Icon name="mapPin" size={15} />
                  </span>
                  <span>
                    <strong className="footer-widget__addr-label">{SITE.office.label}:</strong>
                    {SITE.office.lines.join(', ')}
                  </span>
                </li>

                <li>
                  <span className="icon">
                    <Icon name="mapPin" size={15} />
                  </span>
                  <span>
                    <strong className="footer-widget__addr-label">{SITE.works.label}:</strong>
                    {SITE.works.lines.join(', ')}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="site-footer__bottom">
        <div className="container">
          <div className="site-footer__bottom-inner">
            <p>
              &copy; Copyright {year}{' '}
              <Link to="/" title={SITE.tagline}>
                {SITE.legalName}
              </Link>
              . All Rights Reserved.
            </p>
            <ul className="site-footer__bottom-menu list-unstyled">
              <li>
                Proprietor: <strong>{SITE.proprietor}</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
