import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

export function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const checkForUpdate = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;

        setRegistration(reg);

        // If there's already a waiting SW
        if (reg.waiting) {
          setShowUpdate(true);
        }

        // Listen for new SW installations
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setShowUpdate(true);
            }
          });
        });
      } catch (err) {
        console.warn('[PWA UpdatePrompt] Error:', err);
      }
    };

    checkForUpdate();

    // Also listen for controlling SW change (after skipWaiting)
    const handleControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell the waiting SW to skip waiting and take control
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdate(false);
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          key="update-prompt"
          id="pwa-update-prompt"
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          style={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            zIndex: 9996,
            maxWidth: 320,
            background: 'linear-gradient(135deg, #1a0a2e 0%, #0f0a1e 100%)',
            border: '1px solid rgba(124, 58, 237, 0.4)',
            borderRadius: 16,
            padding: '16px 20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(124, 58, 237, 0.1)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <X size={14} />
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginRight: 20 }}>
            {/* Pulsing dot */}
            <div style={{ position: 'relative', marginTop: 2, flexShrink: 0 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#a78bfa',
                  boxShadow: '0 0 8px #7C3AED',
                }}
              />
            </div>

            <div>
              <p
                style={{
                  margin: '0 0 4px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                }}
              >
                Update Available
              </p>
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.55)',
                  lineHeight: 1.5,
                }}
              >
                A new version of FamilyNest is ready. Reload to get the latest features.
              </p>

              <button
                id="pwa-update-button"
                onClick={handleUpdate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 12px rgba(124, 58, 237, 0.4)',
                }}
              >
                <RefreshCw size={14} />
                Reload & Update
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
