import { useState, useEffect, useCallback } from 'react';

/**
 * BrutalCookieConsent - Cookie 同意弹窗
 * 
 * 使用方式:
 * import BrutalCookieConsent from './BrutalCookieConsent';
 * 
 * <BrutalCookieConsent />
 * 
 * 无需额外 CSS 文件，样式由组件自动注入。
 */

const STORAGE_KEY = 'brutalCookieConsent';

interface ConsentData {
  necessary: boolean;
  clarity: boolean;
  date: string;
}

const CSS = `
.brutal-cookie-root {
  font-family: 'Space Mono', 'Courier New', monospace;
}

.brutal-cookie-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10,10,10,0.85);
  z-index: 998;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s;
}
.brutal-cookie-overlay.active {
  opacity: 1;
  visibility: visible;
}
.brutal-cookie-container {
  position: fixed;
  z-index: 999;
  bottom: 40px;
  left: 40px;
  max-width: 520px;
  width: calc(100% - 80px);
  opacity: 0;
  transform: translateY(60px) skewY(3deg);
  transition: all 0.6s cubic-bezier(0.22,1,0.36,1);
}
.brutal-cookie-container.active {
  opacity: 1;
  transform: translateY(0) skewY(0deg);
}
.brutal-cookie-card-stack {
  position: relative;
}
.brutal-cookie-card-bg {
  position: absolute;
  inset: 0;
  background: #ff006e;
  border: 3px solid #000;
  transform: translate(12px, 12px);
  z-index: 1;
}
.brutal-cookie-card-mid {
  position: absolute;
  inset: 0;
  background: #ffea00;
  border: 3px solid #000;
  transform: translate(6px, 6px);
  z-index: 2;
}
.brutal-cookie-card-main {
  position: relative;
  background: #f0f0f0;
  border: 3px solid #000;
  padding: 28px;
  z-index: 3;
  color: #000;
}
.brutal-cookie-alert-strip {
  position: absolute;
  top: -3px; left: -3px; right: -3px;
  height: 6px;
  background: repeating-linear-gradient(90deg, #ff006e 0px, #ff006e 20px, #ffea00 20px, #ffea00 40px, #00f5ff 40px, #00f5ff 60px);
  animation: brutalStripScroll 2s linear infinite;
}
@keyframes brutalStripScroll {
  0% { background-position: 0 0; }
  100% { background-position: 60px 0; }
}
.brutal-corner-tag {
  position: absolute;
  top: -14px; right: 20px;
  background: #ff006e;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 4px 12px;
  border: 2px solid #000;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transform: rotate(3deg);
  z-index: 10;
}
.brutal-cookie-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}
.brutal-cookie-icon-box {
  width: 56px; height: 56px;
  background: #000;
  border: 3px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}
.brutal-cookie-icon-box::before {
  content: '';
  position: absolute;
  inset: -6px;
  border: 3px solid #39ff14;
  z-index: -1;
}
.brutal-cookie-icon-box svg {
  width: 28px; height: 28px;
  fill: #ffea00;
}
.brutal-cookie-title-block h2 {
  font-family: 'Archivo Black', Impact, sans-serif;
  font-size: 1.4rem;
  line-height: 1.1;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}
.brutal-cookie-title-block .subtitle {
  font-size: 0.75rem;
  color: #ff006e;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.brutal-cookie-body {
  font-size: 0.85rem;
  line-height: 1.7;
  color: #222;
  margin-bottom: 24px;
  padding-left: 16px;
  border-left: 4px solid #00f5ff;
}
.brutal-cookie-body a {
  color: #ff006e;
  text-decoration: none;
  font-weight: 700;
  border-bottom: 2px solid #ff006e;
  transition: all 0.2s;
  white-space: nowrap;
}
.brutal-cookie-body a:hover {
  background: #ff006e;
  color: #fff;
}
.brutal-cookie-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.brutal-btn {
  font-family: 'Space Mono', 'Courier New', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 14px 24px;
  border: 3px solid #000;
  cursor: pointer;
  position: relative;
  transition: all 0.15s;
  outline: none;
  background: #fff;
  color: #000;
}
.brutal-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: #000;
  transform: translate(4px, 4px);
  z-index: -1;
  transition: transform 0.15s;
}
.brutal-btn:hover {
  transform: translate(-2px, -2px);
}
.brutal-btn:hover::before {
  transform: translate(6px, 6px);
}
.brutal-btn:active {
  transform: translate(2px, 2px);
}
.brutal-btn:active::before {
  transform: translate(2px, 2px);
}
.brutal-btn-primary {
  background: #39ff14;
}
.brutal-btn-primary::before {
  background: #ff006e;
}
.brutal-btn-warn {
  background: #ffea00;
}
.brutal-btn-warn::before {
  background: #00f5ff;
}
.brutal-btn-ghost {
  background: #000;
  color: #fff;
}
.brutal-btn-ghost::before {
  background: #00f5ff;
}
.brutal-btn-ghost:hover {
  background: #ff006e;
  color: #fff;
}
.brutal-btn-ghost:hover::before {
  background: #000;
}

.brutal-settings-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease, margin 0.3s ease;
  opacity: 0;
}
.brutal-settings-panel.open {
  max-height: 500px;
  opacity: 1;
  margin-top: 24px;
}
.brutal-settings-divider {
  height: 3px;
  background: #000;
  margin-bottom: 20px;
  position: relative;
}
.brutal-settings-divider::after {
  content: '◆ 设置 ◆';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  background: #f0f0f0;
  padding: 0 12px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.2em;
}
.brutal-setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 2px dashed #ddd;
}
.brutal-setting-row:last-child {
  border-bottom: none;
}
.brutal-setting-info h4 {
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 2px;
}
.brutal-setting-info p {
  font-size: 0.75rem;
  color: #666;
}
.brutal-checkbox {
  appearance: none;
  -webkit-appearance: none;
  width: 44px; height: 28px;
  background: #fff;
  border: 3px solid #000;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  flex-shrink: 0;
}
.brutal-checkbox::after {
  content: '';
  position: absolute;
  top: 2px; left: 2px;
  width: 18px; height: 18px;
  background: #000;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.brutal-checkbox:checked {
  background: #39ff14;
}
.brutal-checkbox:checked::after {
  transform: translateX(16px);
  background: #000;
}
.brutal-checkbox:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #ddd;
}
.brutal-checkbox:disabled::after {
  background: #999;
}

.brutal-toast {
  position: fixed;
  top: 30px; right: 30px;
  background: #ffea00;
  border: 3px solid #000;
  padding: 16px 28px;
  font-weight: 700;
  font-size: 0.9rem;
  color: #000;
  z-index: 1000;
  transform: translateX(150%);
  transition: transform 0.4s cubic-bezier(0.22,1,0.36,1);
  box-shadow: 6px 6px 0 #000;
}
.brutal-toast.show {
  transform: translateX(0);
}

@media (max-width: 640px) {
  .brutal-cookie-container {
    left: 16px; right: 16px; bottom: 16px;
    width: auto; max-width: none;
  }
  .brutal-cookie-card-bg, .brutal-cookie-card-mid {
    display: none;
  }
  .brutal-cookie-actions {
    flex-direction: column;
  }
  .brutal-btn {
    width: 100%;
    text-align: center;
  }
  .brutal-toast {
    left: 16px; right: 16px; top: 16px;
    transform: translateY(-150%);
  }
  .brutal-toast.show {
    transform: translateY(0);
  }
}
`;

// 扩展 Window 类型以支持 Clarity
declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

const CookieIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>
);

// 加载 Umami 脚本（必要 Cookie）
function loadUmami() {
  if (document.getElementById('umami-script')) return;
  const script = document.createElement('script');
  script.id = 'umami-script';
  script.defer = true;
  script.src = 'https://u.a.07210700.xyz/script.js';
  script.setAttribute('data-website-id', '8c770c3a-1f33-4b57-95cd-30e6f7ff7588');
  document.head.appendChild(script);
}

// 加载 Clarity 脚本（可选 Cookie）
function loadClarity() {
  if (window.clarity || document.getElementById('clarity-script')) return;
  const script = document.createElement('script');
  script.id = 'clarity-script';
  script.type = 'text/javascript';
  script.textContent = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window, document, "clarity", "script", "v6jkcs2e6y");`;
  document.head.appendChild(script);
}

function getInitialConsent(): ConsentData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ConsentData;
  } catch {
    // ignore
  }
  return null;
}

export default function BrutalCookieConsent() {
  const initialConsent = getInitialConsent();
  const [showBanner, setShowBanner] = useState(!initialConsent);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [consent, setConsent] = useState<ConsentData | null>(initialConsent);
  const [clarityEnabled, setClarityEnabled] = useState(initialConsent?.clarity ?? false);

  // 注入样式
  useEffect(() => {
    const id = 'brutal-cookie-styles';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = CSS;
      document.head.appendChild(style);
    }
  }, []);

  // 直接加载 Umami（必要 Cookie，无需等待用户同意）
  useEffect(() => {
    loadUmami();
  }, []);

  // 首次访问时延迟显示弹窗
  useEffect(() => {
    const hasConsent = getInitialConsent() !== null;
    if (!hasConsent) {
      const t = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(t);
    }
  }, []);

  // 根据用户选择加载 Clarity（可选 Cookie）
  useEffect(() => {
    if (!consent) return;
    if (consent.clarity) {
      loadClarity();
    }
  }, [consent]);

  const showToast = useCallback((msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  }, []);

  const save = useCallback((data: { necessary: boolean; clarity: boolean }) => {
    const payload = { ...data, date: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setConsent(payload);
    setClarityEnabled(!!payload.clarity);
    
    // 根据选择加载 Clarity
    if (payload.clarity) {
      loadClarity();
    }
  }, []);

  const acceptAll = useCallback(() => {
    save({ necessary: true, clarity: true });
    setShowBanner(false);
    setShowSettings(false);
    showToast('✓ 已接受全部 Cookie，感谢您的配合');
  }, [save, showToast]);

  const acceptNecessary = useCallback(() => {
    save({ necessary: true, clarity: false });
    setShowBanner(false);
    setShowSettings(false);
    showToast('✓ 已启用最小化模式，我们尊重您的选择');
  }, [save, showToast]);

  const toggleSettingsPanel = useCallback(() => {
    if (consent) {
      setClarityEnabled(!!consent.clarity);
    }
    setShowSettings(s => !s);
  }, [consent]);

  const savePreferences = useCallback(() => {
    save({
      necessary: true,
      clarity: clarityEnabled
    });
    setShowBanner(false);
    setShowSettings(false);
    showToast('✓ 偏好设置已保存。');
  }, [save, clarityEnabled, showToast]);

  return (
    <div className="brutal-cookie-root">
      {/* 弹窗遮罩 */}
      <div className={`brutal-cookie-overlay ${showBanner ? 'active' : ''}`} />

      {/* Cookie 弹窗 */}
      <div className={`brutal-cookie-container ${showBanner ? 'active' : ''}`}>
        <div className="brutal-cookie-card-stack">
          <div className="brutal-cookie-card-bg" />
          <div className="brutal-cookie-card-mid" />
          <div className="brutal-cookie-card-main">
            <div className="brutal-cookie-alert-strip" />
            <div className="brutal-corner-tag">重要提示</div>

            <div className="brutal-cookie-header">
              <div className="brutal-cookie-icon-box">
                <CookieIcon />
              </div>
              <div className="brutal-cookie-title-block">
                <h2>WE NEED<br />YOUR DATA</h2>
                <div className="subtitle">（但我们很友好）</div>
              </div>
            </div>

            <div className="brutal-cookie-body">
              我们使用 Cookie 和类似的追踪技术来分析网站流量和用户体验。
              Umami 用于基础的访问统计（必要），Microsoft Clarity 用于用户行为分析（可选）。
              您可以选择仅接受必要的追踪，或自定义您的偏好设置。
            </div>

            <div className="brutal-cookie-actions">
              <button className="brutal-btn brutal-btn-primary" onClick={acceptAll}>
                [ 全部接受 ]
              </button>
              <button className="brutal-btn brutal-btn-warn" onClick={acceptNecessary}>
                [ 仅必要 ]
              </button>
              <button className="brutal-btn brutal-btn-ghost" onClick={toggleSettingsPanel}>
                [ 自定义 ]
              </button>
            </div>

            <div className={`brutal-settings-panel ${showSettings ? 'open' : ''}`}>
              <div className="brutal-settings-divider" />

              <div className="brutal-setting-row">
                <div className="brutal-setting-info">
                  <h4>Umami（必要）</h4>
                  <p>基础访问统计，不包含个人身份信息</p>
                </div>
                <input type="checkbox" className="brutal-checkbox" checked disabled readOnly />
              </div>

              <div className="brutal-setting-row">
                <div className="brutal-setting-info">
                  <h4>Microsoft Clarity（可选）</h4>
                  <p>用户行为分析和热力图</p>
                </div>
                <input
                  type="checkbox"
                  className="brutal-checkbox"
                  checked={clarityEnabled}
                  onChange={e => setClarityEnabled(e.target.checked)}
                />
              </div>

              <div className="brutal-cookie-actions" style={{ marginTop: 16 }}>
                <button className="brutal-btn brutal-btn-primary" onClick={savePreferences}>
                  [ 保存设置 ]
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`brutal-toast ${toast.show ? 'show' : ''}`}>
        {toast.msg}
      </div>
    </div>
  );
}
