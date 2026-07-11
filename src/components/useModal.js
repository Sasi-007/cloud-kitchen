'use client';

import { useState, useCallback } from 'react';

export function useModal() {
  const [config, setConfig] = useState(null);
  const [inputVal, setInputVal] = useState('');

  const show = useCallback((cfg) => {
    return new Promise((resolve) => {
      setInputVal(cfg.defaultValue || '');
      setConfig({ ...cfg, resolve });
    });
  }, []);

  const showConfirm = useCallback((cfg) => show({ type: 'confirm', ...cfg }), [show]);
  const showPrompt  = useCallback((cfg) => show({ type: 'prompt',  ...cfg }), [show]);

  function handleConfirm() {
    const val = config.type === 'prompt' ? inputVal : true;
    config.resolve(val);
    setConfig(null);
  }
  function handleCancel() {
    config.resolve(config.type === 'prompt' ? null : false);
    setConfig(null);
  }

  const modal = config ? (
    <>
      {/* Inject responsive styles */}
      <style>{`
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.50);
          z-index: 9000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 0;
          animation: modalFadeIn 0.2s ease;
        }
        .modal-box {
          background: #fff;
          border-radius: 20px 20px 0 0;
          width: 100%;
          max-width: 100%;
          padding: 28px 22px 36px;
          box-shadow: 0 -8px 40px rgba(0,0,0,0.18);
          animation: modalSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        @media (min-width: 600px) {
          .modal-overlay {
            align-items: center;
            padding: 20px;
          }
          .modal-box {
            border-radius: 20px;
            max-width: 420px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            animation: modalScaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1);
          }
        }
        @keyframes modalFadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes modalSlideUp  { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes modalScaleIn  { from { opacity:0; transform: scale(0.93) } to { opacity:1; transform: scale(1) } }
        .modal-input {
          width: 100%; padding: 13px 14px;
          border-radius: 12px; border: 1.5px solid #e5e7eb;
          font-size: 1rem; outline: none; box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .modal-input:focus { border-color: var(--primary, #ff6b35); }
        .modal-btn {
          flex: 1; border: none; border-radius: 12px;
          padding: 14px; font-weight: 800; font-size: 0.95rem;
          cursor: pointer; transition: opacity 0.15s;
        }
        .modal-btn:active { opacity: 0.85; }
        .modal-btn-cancel { background: #f3f4f6; color: #374151; }
        .modal-btn-confirm { background: var(--primary, #ff6b35); color: #fff; }
        .modal-btn-danger  { background: #dc2626; color: #fff; }
      `}</style>

      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}>
        <div className="modal-box">

          {/* Icon */}
          <div style={{ fontSize: '2.4rem', marginBottom: 10, lineHeight: 1 }}>
            {config.danger ? '⚠️' : config.icon || (config.type === 'prompt' ? '✏️' : '❓')}
          </div>

          {/* Title */}
          <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: config.message ? 6 : 16, color: config.danger ? '#dc2626' : '#111' }}>
            {config.title}
          </div>

          {/* Message */}
          {config.message && (
            <p style={{ fontSize: '0.88rem', color: '#6b7280', marginBottom: 18, lineHeight: 1.65 }}>
              {config.message}
            </p>
          )}

          {/* Input */}
          {config.type === 'prompt' && (
            <div style={{ marginBottom: 18 }}>
              {config.label && (
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                  {config.label}
                </label>
              )}
              <input
                autoFocus
                className="modal-input"
                type={config.inputType || 'text'}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={config.placeholder || ''}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') handleCancel(); }}
              />
              {config.hint && (
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 6 }}>{config.hint}</div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="modal-btn modal-btn-cancel" onClick={handleCancel}>
              {config.cancelLabel || 'Cancel'}
            </button>
            <button
              className={`modal-btn ${config.danger ? 'modal-btn-danger' : 'modal-btn-confirm'}`}
              onClick={handleConfirm}
            >
              {config.confirmLabel || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </>
  ) : null;

  return { modal, showConfirm, showPrompt };
}
