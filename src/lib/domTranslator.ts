import { OVERRIDES_MAP } from './i18n';
import type { Country } from './i18n';

/**
 * Tradutor DOM: percorre nós de texto e atributos visíveis
 * (placeholder, title, aria-label, alt) e substitui strings PT-PT
 * pelas suas versões locais quando o país for diferente de PT.
 *
 * Só substitui matches EXACTOS (após trim) contra o dicionário
 * `OVERRIDES` — isto evita tocar em dados do utilizador (nomes
 * de produtos, comentários, etc.).
 */

const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'] as const;
let observer: MutationObserver | null = null;
let activeCountry: Country = 'PT';

function translate(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const override = OVERRIDES_MAP.get(trimmed)?.[activeCountry];
  if (!override || override === trimmed) return null;
  return text.replace(trimmed, override);
}

function walk(node: Node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = node.nodeValue;
    if (t) {
      const next = translate(t);
      if (next !== null) node.nodeValue = next;
    }
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as Element;
  const tag = el.tagName;
  if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return;

  for (const attr of ATTRS) {
    const v = el.getAttribute(attr);
    if (v) {
      const next = translate(v);
      if (next !== null) el.setAttribute(attr, next);
    }
  }
  // Traduz value de inputs só quando são botões (submit/reset), não campos editáveis.
  if (tag === 'INPUT') {
    const type = (el as HTMLInputElement).type;
    if (type === 'submit' || type === 'button' || type === 'reset') {
      const v = (el as HTMLInputElement).value;
      const next = translate(v);
      if (next !== null) (el as HTMLInputElement).value = next;
    }
    return;
  }

  el.childNodes.forEach(walk);
}

export function startDomTranslator(country: Country) {
  stopDomTranslator();
  activeCountry = country;
  if (country === 'PT') return; // Nada a fazer

  // Passagem inicial.
  walk(document.body);

  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
        const t = m.target.nodeValue;
        if (t) {
          const next = translate(t);
          if (next !== null && next !== t) m.target.nodeValue = next;
        }
      } else if (m.type === 'childList') {
        m.addedNodes.forEach(walk);
      } else if (m.type === 'attributes' && m.target.nodeType === Node.ELEMENT_NODE) {
        const el = m.target as Element;
        const name = m.attributeName;
        if (!name) continue;
        if ((ATTRS as readonly string[]).includes(name)) {
          const v = el.getAttribute(name);
          if (v) {
            const next = translate(v);
            if (next !== null) el.setAttribute(name, next);
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRS],
  });
}

export function stopDomTranslator() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}