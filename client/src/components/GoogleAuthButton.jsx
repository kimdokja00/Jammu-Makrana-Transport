import { useEffect, useRef, useState } from 'react';

/**
 * Official Google 4-Color 'G' Logo
 */
function GoogleLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export default function GoogleAuthButton({ onSuccess, onError, mode = 'signin' }) {
  const containerRef = useRef(null);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Load Google Identity Services script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.google?.accounts?.id) {
      setGisLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGisLoaded(true);
    script.onerror = () => {
      console.warn('Google Identity Services script failed to load.');
    };
    document.head.appendChild(script);
  }, []);

  // Initialize official GIS button when Client ID is available
  useEffect(() => {
    if (!gisLoaded || !clientId || !containerRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (res) => {
          if (res?.credential) {
            onSuccess?.(res.credential);
          } else {
            onError?.('Google authentication returned no credentials.');
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render official Google button
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: mode === 'signup' ? 'signup_with' : 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 320,
      });
    } catch (err) {
      console.warn('Google button render error:', err);
    }
  }, [gisLoaded, clientId, mode, onSuccess, onError]);

  const handleCustomClick = () => {
    if (clientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setShowConfigModal(true);
    }
  };

  const handleDemoSignIn = (e) => {
    e.preventDefault();
    const emailToUse = testEmail.trim() ? `demo-google:${testEmail.trim()}` : 'demo-google-token';
    setShowConfigModal(false);
    onSuccess?.(emailToUse);
  };

  return (
    <div className="google-auth-wrapper">
      {/* Official GIS container rendered when VITE_GOOGLE_CLIENT_ID exists */}
      {clientId ? (
        <div ref={containerRef} className="google-official-btn-slot" />
      ) : (
        <button
          type="button"
          onClick={handleCustomClick}
          className="google-custom-btn"
          title="Sign in with your Google Account"
        >
          <GoogleLogo size={20} />
          <span>{mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}</span>
        </button>
      )}

      {/* Development / Configuration helper modal if Client ID is not yet in .env */}
      {showConfigModal && (
        <div className="google-modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="google-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="google-modal-header">
              <GoogleLogo size={24} />
              <h3>Google Authentication</h3>
              <button
                type="button"
                className="google-modal-close"
                onClick={() => setShowConfigModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="google-modal-body">
              <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.5, marginBottom: '14px' }}>
                Google Sign-In is enabled! To connect to live Google accounts, configure{' '}
                <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                  VITE_GOOGLE_CLIENT_ID
                </code>{' '}
                in your Vercel or local environment.
              </p>

              <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
                <strong style={{ display: 'block', fontSize: '13px', color: '#111827', marginBottom: '6px' }}>
                  Test Google Flow Right Now:
                </strong>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
                  Click below to immediately log in with a verified simulated Google profile:
                </p>

                <form onSubmit={handleDemoSignIn}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="email"
                      placeholder="test.customer@gmail.com (optional)"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px',
                      }}
                    />
                    <button
                      type="submit"
                      className="thm-btn"
                      style={{ padding: '7px 16px', fontSize: '13px' }}
                    >
                      Instant Test Login
                    </button>
                  </div>
                </form>
              </div>

              <div style={{ fontSize: '12px', color: '#6b7280', borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>
                <strong>For live Google sign-in:</strong>
                <ol style={{ paddingLeft: '18px', marginTop: '4px', lineHeight: 1.4 }}>
                  <li>Go to Google Cloud Console ➔ APIs &amp; Services ➔ Credentials</li>
                  <li>Create OAuth 2.0 Client ID (Web Application)</li>
                  <li>Add your site domain in Authorized Javascript Origins</li>
                  <li>Add <code>VITE_GOOGLE_CLIENT_ID</code> to Vercel Environment Variables</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
