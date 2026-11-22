import { useEffect, useRef, useState } from 'react';

const LANGUAGES: { code: string; label: string }[] = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
  { code: 'it', label: 'IT' },
  { code: 'de', label: 'DE' },
  { code: 'nl', label: 'NL' },
];

const SOURCE_LANGUAGE = 'pt';
const GOOGLE_COMBO_SELECTOR = 'select.goog-te-combo';

type GTranslateWindow = Window & {
  doGTranslate?: (pair: string) => void;
  gt_translate_script?: HTMLScriptElement;
};

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function readCurrentLang(): string {
  try {
    const match = document.cookie.match(/googtrans=([^;]+)/);
    if (match) {
      const parts = decodeURIComponent(match[1]).split('/');
      const code = parts[parts.length - 1];
      if (code && LANGUAGES.some((l) => l.code === code)) return code;
    }
  } catch {
    return 'pt';
  }
  return 'pt';
}

function writeGTranslateCookie(code: string) {
  // Persist choice via cookie for both host and eTLD+1
  const value = `/${SOURCE_LANGUAGE}/${code}`;
  const host = window.location.hostname;
  const expires = 'expires=Fri, 31 Dec 9999 23:59:59 GMT';
  document.cookie = `googtrans=${value};path=/;${expires}`;
  if (host && host !== 'localhost') {
    document.cookie = `googtrans=${value};path=/;domain=${host};${expires}`;
    const parts = host.split('.');
    if (parts.length > 1) {
      document.cookie = `googtrans=${value};path=/;domain=.${parts.slice(-2).join('.')};${expires}`;
    }
  }
}

function triggerGoogleChange(select: HTMLSelectElement) {
  const changeEvent = document.createEvent('HTMLEvents');
  changeEvent.initEvent('change', true, true);
  select.dispatchEvent(changeEvent);
  select.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
}

function selectHasLanguage(select: HTMLSelectElement, code: string) {
  return Array.from(select.options).some((option) => option.value === code);
}

function loadGoogleTranslateLibrary() {
  const w = window as GTranslateWindow;
  if (w.gt_translate_script) return;

  const script = document.createElement('script');
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit2';
  document.body.appendChild(script);
  w.gt_translate_script = script;
}

async function driveGoogleCombo(
  code: string,
  shouldContinue: () => boolean,
  attempts = 24,
  interval = 250
) {
  for (let i = 0; i < attempts; i += 1) {
    if (!shouldContinue()) return true;

    const select = document.querySelector<HTMLSelectElement>(GOOGLE_COMBO_SELECTOR);
    if (select && select.options.length > 0) {
      const value = code === SOURCE_LANGUAGE && !selectHasLanguage(select, code) ? '' : code;
      if (value === '' || selectHasLanguage(select, value)) {
        select.value = value;
        triggerGoogleChange(select);
        await wait(80);
        if (!shouldContinue()) return true;
        triggerGoogleChange(select);
        return true;
      }
    }

    await wait(interval);
  }

  return false;
}

async function setLang(code: string, shouldContinue: () => boolean) {
  writeGTranslateCookie(code);
  loadGoogleTranslateLibrary();

  const w = window as GTranslateWindow;
  const pair = `${SOURCE_LANGUAGE}|${code}`;
  const usedHelper = typeof w.doGTranslate === 'function';
  if (usedHelper) {
    w.doGTranslate?.(pair);
  }

  const usedCombo = await driveGoogleCombo(code, shouldContinue);
  if (!shouldContinue()) return true;

  if (!usedCombo) {
    writeGTranslateCookie(code);
    if (typeof w.doGTranslate === 'function') {
      w.doGTranslate(pair);
    }
    return driveGoogleCombo(code, shouldContinue, 8, 300) || usedHelper;
  }

  return true;
}

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('pt');
  const [pending, setPending] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    setCurrent(readCurrentLang());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const currentLabel = LANGUAGES.find((l) => l.code === current)?.label || 'PT';

  const handleLanguageSelect = async (code: string) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const shouldContinue = () => requestRef.current === requestId;

    setCurrent(code);
    setPending(code);
    setOpen(false);

    try {
      const applied = await setLang(code, shouldContinue);
      if (!shouldContinue()) return;
      setCurrent(readCurrentLang());
      if (!applied) window.location.reload();
    } finally {
      if (shouldContinue()) setPending(null);
    }
  };

  return (
    <div ref={ref} className="fixed bottom-8 left-0 z-40 notranslate" translate="no">
      {open && (
        <div className="absolute bottom-14 left-2 mb-2 bg-gray-50/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-soft-lg p-2 min-w-[80px] animate-scaleIn">
          {LANGUAGES.map((lang) => {
            const active = lang.code === current;
            return (
              <button
                key={lang.code}
                onClick={() => void handleLanguageSelect(lang.code)}
                className={`w-full text-center px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-accent text-gray-50'
                    : 'text-gray-700 hover:bg-gray-100'
                } ${pending === lang.code ? 'opacity-70' : ''}`}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-12 rounded-r-full rounded-l-none bg-accent hover:bg-accent-hover text-gray-50 shadow-soft-lg flex items-center justify-center font-bold text-sm transition-transform hover:scale-105 pl-2"
        aria-label="Change language"
      >
        {currentLabel}
      </button>
    </div>
  );
}
