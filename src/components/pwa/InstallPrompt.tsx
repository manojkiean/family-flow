import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'pwa-install-dismissed';

function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as any).standalone === true)
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed recently
    if (isInStandaloneMode()) return;
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      // Re-show after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    const ios = isIOS();
    setIsIOSDevice(ios);

    if (ios) {
      // Show iOS instructions after a short delay
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Install Sheet */}
          <motion.div
            key="install-sheet"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] safe-area-bottom"
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #1a0a2e 0%, #16041f 50%, #0f0a1e 100%)',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                borderBottom: 'none',
                borderRadius: '24px 24px 0 0',
                padding: '8px 24px 32px',
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center mb-6 mt-2">
                <div
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 9999,
                    background: 'rgba(124, 58, 237, 0.4)',
                  }}
                />
              </div>

              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                id="pwa-install-dismiss"
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                <X size={16} />
              </button>

              {/* App info */}
              <div className="flex items-center gap-4 mb-6">
                <img
                  src="/pwa-192.png"
                  alt="FamilyNest"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    boxShadow: '0 0 20px rgba(124, 58, 237, 0.5)',
                  }}
                />
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>
                    FamilyNest
                  </h2>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: '2px 0 0' }}>
                    familynest.app
                  </p>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', marginBottom: 20, lineHeight: 1.5 }}>
                {isIOSDevice
                  ? 'Add FamilyNest to your home screen for the full app experience — works offline too!'
                  : 'Install FamilyNest on your device for a faster, full-screen experience that works offline.'}
              </p>

              {/* Features */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginBottom: 24,
                }}
              >
                {[
                  '📵 Works Offline',
                  '⚡ Instant Launch',
                  '🔔 Push Notifications',
                  '🏠 Home Screen Icon',
                ].map((f) => (
                  <div
                    key={f}
                    style={{
                      background: 'rgba(124, 58, 237, 0.12)',
                      border: '1px solid rgba(124, 58, 237, 0.2)',
                      borderRadius: 10,
                      padding: '8px 12px',
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.8)',
                    }}
                  >
                    {f}
                  </div>
                ))}
              </div>

              {isIOSDevice ? (
                /* iOS instructions */
                <div
                  style={{
                    background: 'rgba(124, 58, 237, 0.12)',
                    border: '1px solid rgba(124, 58, 237, 0.3)',
                    borderRadius: 14,
                    padding: '16px 20px',
                  }}
                >
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.7 }}>
                    <strong style={{ color: '#a78bfa' }}>How to install on iOS:</strong>
                    <br />
                    1. Tap the <Share size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> <strong>Share</strong> button in Safari
                    <br />
                    2. Scroll down and tap <strong>"Add to Home Screen"</strong>
                    <br />
                    3. Tap <strong>"Add"</strong> — that's it! 🎉
                  </p>
                </div>
              ) : (
                /* Android / Desktop install button */
                <button
                  id="pwa-install-button"
                  onClick={handleInstall}
                  disabled={installing}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: installing
                      ? 'rgba(124, 58, 237, 0.5)'
                      : 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                    border: 'none',
                    borderRadius: 14,
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: installing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 24px rgba(124, 58, 237, 0.4)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {installing ? (
                    <>Installing…</>
                  ) : (
                    <>
                      <Download size={18} />
                      Install FamilyNest
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleDismiss}
                style={{
                  width: '100%',
                  marginTop: 12,
                  padding: '14px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 14,
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                Not now
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
