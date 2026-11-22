import { useEffect, useState, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import Icon from './Icon.jsx';
import BrandMark from './BrandMark.jsx';
import { NAV_LINKS, SITE } from '../data/siteContent.js';
import { useAuth } from '../context/AuthContext.jsx';

export function Header() {
  const [stuck, setStuck] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [portalMenuOpen, setPortalMenuOpen] = useState(false);
  const portalDropdownRef = useRef(null);
  const location = useLocation();

  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the drawer & dropdown whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
    setPortalMenuOpen(false);
  }, [location.pathname]);

  // Click outside listener for the portal dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (portalDropdownRef.current && !portalDropdownRef.current.contains(event.target)) {
        setPortalMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const renderLink = (link, className, onClick) => {
    if (link.href) {
      return (
        <a
          key={link.label}
          href={link.href}
          className={className}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
        >
          {link.label}
        </a>
      );
    }
    return (
      <NavLink
        key={link.label}
        to={link.to}
        onClick={onClick}
        className={({ isActive }) => `${className}${isActive ? ' current' : ''}`}
      >
        {link.label}
      </NavLink>
    );
  };

  return (
    <>
      <header className={`main-header clearfix${stuck ? ' is-stuck' : ''}`}>
        <div className="main-header__top">
          <div className="container">
            <div className="main-header__top-inner">
              <ul className="main-header__contact list-unstyled">
                {SITE.phones.map((phone) => (
                  <li key={phone.href}>
                    <Icon name="phone" size={15} />
                    <a href={phone.href}>{phone.label}</a>
                  </li>
                ))}
              </ul>

              <div className="main-header__meta">
                <span className="main-header__since">Trading since {SITE.since}</span>
                {SITE.socials.length ? (
                  <div className="main-header__social">
                    {SITE.socials.map((social) => (
                      <a
                        key={social.href}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                      >
                        <Icon name={social.icon} size={15} />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="main-menu-wrapper">
            <BrandMark />

            <nav className="main-menu" aria-label="Main navigation">
              <ul className="main-menu__list list-unstyled">
                {NAV_LINKS.map((link) => renderLink(link, 'main-menu__link'))}
              </ul>

              <div className="main-menu__right">
                {/* Authentication & Portal Dropdown */}
                <div className="portal-dropdown-wrap" ref={portalDropdownRef}>
                  {isAuthenticated ? (
                    <button
                      type="button"
                      className="portal-nav-btn portal-nav-btn--logged"
                      onClick={() => setPortalMenuOpen((prev) => !prev)}
                      aria-expanded={portalMenuOpen}
                      aria-label="User Account Menu"
                    >
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt=""
                          style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Icon name="badge" size={15} />
                      )}
                      <span>{isAdmin ? 'Admin Console' : (user?.fullName?.split(' ')[0] || 'My Orders')}</span>
                      <small style={{ fontSize: '10px' }}>▼</small>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="portal-nav-btn"
                      onClick={() => setPortalMenuOpen((prev) => !prev)}
                      aria-expanded={portalMenuOpen}
                      aria-label="Portals Sign In"
                    >
                      <Icon name="check" size={14} />
                      <span>Portals</span>
                      <small style={{ fontSize: '10px' }}>▼</small>
                    </button>
                  )}

                  {portalMenuOpen && (
                    <div className="portal-dropdown-menu">
                      {isAuthenticated ? (
                        <>
                          <div className="portal-dropdown-user">
                            <strong>{user?.fullName}</strong>
                            <small>{user?.email}</small>
                            <span className="portal-role-badge">
                              {isAdmin ? 'Admin Access' : 'Customer Account'}
                            </span>
                          </div>
                          <hr className="portal-divider" />
                          {isAdmin ? (
                            <Link to="/admin/dashboard" className="portal-dropdown-item">
                              <Icon name="building" size={14} /> Admin Orders Console
                            </Link>
                          ) : (
                            <>
                              <Link to="/customer/dashboard" className="portal-dropdown-item">
                                <Icon name="truck" size={14} /> My Orders & Tracking
                              </Link>
                              <Link to="/transportation#booking-form" className="portal-dropdown-item">
                                <Icon name="check" size={14} /> Book New Freight
                              </Link>
                            </>
                          )}
                          <hr className="portal-divider" />
                          <button
                            type="button"
                            onClick={logout}
                            className="portal-dropdown-item portal-dropdown-item--logout"
                          >
                            <Icon name="close" size={14} /> Sign Out
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="portal-dropdown-title">Select Portal</div>
                          <Link to="/customer/login" className="portal-dropdown-item">
                            <Icon name="truck" size={14} /> Customer Sign In
                          </Link>
                          <Link to="/customer/register" className="portal-dropdown-item">
                            <Icon name="check" size={14} /> Customer Register
                          </Link>
                          <hr className="portal-divider" />
                          <Link to="/admin/login" className="portal-dropdown-item portal-dropdown-item--admin">
                            <Icon name="badge" size={14} /> Admin Fleet Console
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Link to="/contact" className="thm-btn thm-btn--sm">
                  Contact
                </Link>

                <button
                  type="button"
                  className="mobile-nav__toggler"
                  aria-label="Open menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen(true)}
                >
                  <Icon name="bars" size={22} />
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <div className={`mobile-nav${menuOpen ? ' is-open' : ''}`}>
        <div className="mobile-nav__overlay" onClick={() => setMenuOpen(false)} />
        <div className="mobile-nav__content">
          <button
            type="button"
            className="mobile-nav__close"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <Icon name="close" size={20} />
          </button>

          <div className="mobile-nav__logo">
            <BrandMark />
          </div>

          <ul className="mobile-nav__list list-unstyled">
            {NAV_LINKS.map((link) => renderLink(link, 'mobile-nav__link', () => setMenuOpen(false)))}
          </ul>

          <div className="mobile-nav__portals">
            <span className="mobile-portal-title">Account & Portals</span>
            {isAuthenticated ? (
              <div className="mobile-portal-user">
                <p>
                  Signed in as <strong>{user?.fullName}</strong>
                </p>
                {isAdmin ? (
                  <Link
                    to="/admin/dashboard"
                    className="thm-btn thm-btn--sm thm-btn--full"
                    onClick={() => setMenuOpen(false)}
                    style={{ marginBottom: '8px' }}
                  >
                    Admin Console
                  </Link>
                ) : (
                  <Link
                    to="/customer/dashboard"
                    className="thm-btn thm-btn--sm thm-btn--full"
                    onClick={() => setMenuOpen(false)}
                    style={{ marginBottom: '8px' }}
                  >
                    My Orders & Tracking
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="thm-btn thm-btn--outline thm-btn--sm thm-btn--full"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="mobile-portal-links">
                <Link
                  to="/customer/login"
                  className="thm-btn thm-btn--sm thm-btn--full"
                  onClick={() => setMenuOpen(false)}
                  style={{ marginBottom: '8px' }}
                >
                  Customer Login
                </Link>
                <Link
                  to="/admin/login"
                  className="thm-btn thm-btn--outline thm-btn--sm thm-btn--full"
                  onClick={() => setMenuOpen(false)}
                >
                  Admin Console
                </Link>
              </div>
            )}
          </div>

          <div className="mobile-nav__action" style={{ marginTop: '16px' }}>
            <Link
              to="/contact"
              className="thm-btn thm-btn--sm thm-btn--full"
              onClick={() => setMenuOpen(false)}
            >
              Contact Us
            </Link>
          </div>

          <ul className="mobile-nav__contact list-unstyled">
            {SITE.phones.map((phone) => (
              <li key={phone.href}>
                <Icon name="phone" size={15} />
                <a href={phone.href}>{phone.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

export default Header;
