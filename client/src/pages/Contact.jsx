import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import BrandMark from '../components/BrandMark.jsx';
import { submitEnquiry } from '../lib/api.js';
import { usePageMeta } from '../lib/usePageMeta.js';
import { SITE } from '../data/siteContent.js';

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '', website: '' };

export default function Contact() {
  usePageMeta(
    `Contact Us | ${SITE.legalName} — Makrana, Rajasthan`,
    `Get in touch with ${SITE.legalName} in Makrana, Rajasthan for marble, granite, sandstone, limestone, slate and industrial minerals. Call ${SITE.phone} or request a free quote.`
  );

  const [params] = useSearchParams();
  const stone = params.get('stone') || '';

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [serverError, setServerError] = useState('');

  // Pre-fill when the visitor arrived from a stone detail page.
  useEffect(() => {
    if (stone) {
      setForm((prev) => ({
        ...prev,
        subject: `Enquiry about ${stone}`,
        message: `I would like more information about ${stone}. `,
      }));
    }
  }, [stone]);

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Honeypot: real visitors never fill this hidden field.
    if (form.website) {
      setStatus('sent');
      return;
    }

    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email';
    if (!form.phone.trim()) nextErrors.phone = 'Phone is required';
    if (!form.subject.trim()) nextErrors.subject = 'Subject is required';
    if (form.message.trim().length < 10) nextErrors.message = 'Please add a little more detail';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setStatus('sending');
    setServerError('');

    try {
      await submitEnquiry({
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: form.subject,
        message: form.message,
        stoneOfInterest: stone,
      });
      setStatus('sent');
      setForm(EMPTY);
    } catch (err) {
      setStatus('error');
      setServerError(err.message || 'Something went wrong. Please call us instead.');
      setErrors(err.errors || {});
    }
  };

  return (
    <>
      <PageHeader title="Contact" crumbs={[{ label: 'Contact' }]} />

      <section className="contact">
        <div className="container">
          <div className="contact__grid">
            <div className="contact__form-wrap">
              <h2 className="section-title__title">Leave a message</h2>
              <p className="contact__intro">
                Tell us the stone or mineral you need, the quantity and your delivery location &mdash; we will
                come back with availability and pricing.
              </p>

              {status === 'sent' ? (
                <p className="alert alert--success" role="status">
                  <Icon name="check" size={16} /> Thank you &mdash; your enquiry has reached us. Our team will
                  get back to you shortly.
                </p>
              ) : null}

              {status === 'error' ? (
                <p className="alert alert--error" role="alert">
                  {serverError}
                </p>
              ) : null}

              <form className="contact__form" onSubmit={handleSubmit} noValidate>
                <div className="form-row">
                  <div className="form-field">
                    <input
                      type="text"
                      name="name"
                      placeholder="Your name"
                      value={form.name}
                      onChange={update('name')}
                      required
                    />
                    {errors.name ? <span className="form-error">{errors.name}</span> : null}
                  </div>
                  <div className="form-field">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email address"
                      value={form.email}
                      onChange={update('email')}
                      required
                    />
                    {errors.email ? <span className="form-error">{errors.email}</span> : null}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <input
                      type="text"
                      name="phone"
                      placeholder="Your Phone"
                      maxLength={10}
                      value={form.phone}
                      onChange={update('phone')}
                      required
                    />
                    {errors.phone ? <span className="form-error">{errors.phone}</span> : null}
                  </div>
                  <div className="form-field">
                    <input
                      type="text"
                      name="subject"
                      placeholder="Subject"
                      value={form.subject}
                      onChange={update('subject')}
                      required
                    />
                    {errors.subject ? <span className="form-error">{errors.subject}</span> : null}
                  </div>
                </div>

                <div className="form-field">
                  <textarea
                    name="message"
                    rows={5}
                    placeholder="Stone / mineral required, quantity, delivery location"
                    value={form.message}
                    onChange={update('message')}
                    required
                  />
                  {errors.message ? <span className="form-error">{errors.message}</span> : null}
                </div>

                {/* Honeypot */}
                <input
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={update('website')}
                  autoComplete="off"
                  tabIndex={-1}
                  className="hp-field"
                  aria-hidden="true"
                />

                <button type="submit" className="thm-btn" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            </div>

            <aside className="contact__details">
              <BrandMark light />
              <p className="contact__details-text">
                {SITE.businessType} &mdash; Makrana, Rajasthan
              </p>

              <ul className="contact__list list-unstyled">
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
                    <strong className="contact__addr-label">{SITE.office.label}</strong>
                    {SITE.office.lines.map((line) => (
                      <span key={line} className="contact__addr-line">
                        {line}
                      </span>
                    ))}
                  </span>
                </li>

                <li>
                  <span className="icon">
                    <Icon name="mapPin" size={15} />
                  </span>
                  <span>
                    <strong className="contact__addr-label">{SITE.works.label}</strong>
                    {SITE.works.lines.map((line) => (
                      <span key={line} className="contact__addr-line">
                        {line}
                      </span>
                    ))}
                  </span>
                </li>

                <li>
                  <span className="icon">
                    <Icon name="badge" size={15} />
                  </span>
                  <span>
                    <strong className="contact__addr-label">GST No.</strong>
                    <span className="contact__addr-line">{SITE.gst}</span>
                  </span>
                </li>
              </ul>

              {SITE.socials.length ? (
                <div className="contact__social">
                  {SITE.socials.map((social) => (
                    <a
                      key={social.href}
                      href={social.href}
                      className={social.className}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                    >
                      <Icon name={social.icon} size={16} />
                    </a>
                  ))}
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      <section className="contact-map">
        <iframe
          title={`${SITE.name} location, Makrana`}
          src="https://maps.google.com/maps?q=RIICO%20Area%2C%20Bidyand%20Road%2C%20Makrana%2C%20Rajasthan&t=m&z=13&output=embed&iwloc=near"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>
    </>
  );
}
