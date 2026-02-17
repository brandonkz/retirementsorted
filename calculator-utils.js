(function () {
  const currencyFormatter = new Intl.NumberFormat('en-ZA', {
    maximumFractionDigits: 0
  });

  function parseNumber(value) {
    if (value === null || value === undefined) return 0;
    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatCurrency(value) {
    if (!Number.isFinite(value)) return '';
    return `R ${currencyFormatter.format(Math.round(value))}`;
  }

  function formatPercent(value) {
    if (!Number.isFinite(value)) return '';
    return `${value.toFixed(2)}%`;
  }

  function setCaretToEnd(input) {
    const length = input.value.length;
    input.setSelectionRange(length, length);
  }

  function bindCurrencyInput(input) {
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('autocomplete', 'off');

    const format = () => {
      const value = parseNumber(input.value);
      input.value = value ? formatCurrency(value) : '';
      setCaretToEnd(input);
    };

    input.addEventListener('focus', () => {
      const value = parseNumber(input.value);
      input.value = value ? String(Math.round(value)) : '';
    });

    input.addEventListener('blur', format);
    input.addEventListener('input', () => {
      const value = parseNumber(input.value);
      input.value = value ? formatCurrency(value) : '';
      setCaretToEnd(input);
    });
  }

  function initCurrencyInputs() {
    document.querySelectorAll('input[data-currency]').forEach(bindCurrencyInput);
  }

  function getCurrencyValue(inputOrId) {
    const input =
      typeof inputOrId === 'string'
        ? document.getElementById(inputOrId)
        : inputOrId;
    return parseNumber(input ? input.value : 0);
  }

  function setCurrencyText(id, value, opts) {
    const el = document.getElementById(id);
    if (!el) return;
    const prefix = opts && opts.prefix ? opts.prefix : '';
    const formatted = Number.isFinite(value)
      ? `${prefix}${formatCurrency(value)}`
      : `${prefix}R 0`;
    el.textContent = formatted;
  }

  function buildShareText() {
    const label = document.getElementById('viral-label');
    const title = document.getElementById('viral-title');
    const main = document.getElementById('viral-main');
    const subtitle = document.getElementById('viral-subtitle');

    const parts = [];
    if (label && label.textContent) parts.push(label.textContent.trim());
    if (title && title.textContent && main && main.textContent) {
      parts.push(`${title.textContent.trim()}: ${main.textContent.trim()}`);
    } else if (main && main.textContent) {
      parts.push(main.textContent.trim());
    }
    if (subtitle && subtitle.textContent) parts.push(subtitle.textContent.trim());

    parts.push(`Calculate yours: ${window.location.href}`);
    return parts.join('\n');
  }

  function trackEvent(action, params) {
    if (typeof gtag === 'function') {
      gtag('event', action, params || {});
    }
  }

  const calculatorUsage = {};
  function trackCalculatorUse(name) {
    const now = Date.now();
    const last = calculatorUsage[name] || 0;
    if (now - last < 5000) return;
    calculatorUsage[name] = now;
    trackEvent('calculator_use', {
      calculator_name: name,
      page_location: window.location.pathname,
      page_title: document.title
    });
  }

  function initShareButtons() {
    document.querySelectorAll('[data-share]').forEach((button) => {
      button.addEventListener('click', () => {
        const method = button.getAttribute('data-share');
        const text = encodeURIComponent(buildShareText());

        if (method === 'twitter') {
          window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
        } else if (method === 'whatsapp') {
          window.open(`https://wa.me/?text=${text}`, '_blank');
        }

        trackEvent('share', { method });
      });
    });
  }

  function initCopyButtons() {
    document.querySelectorAll('[data-action="copy"]').forEach((button) => {
      button.addEventListener('click', () => {
        const text = buildShareText();
        navigator.clipboard.writeText(text).then(() => {
          const original = button.textContent;
          button.textContent = 'Copied!';
          setTimeout(() => {
            button.textContent = original;
          }, 2000);
        });
        trackEvent('share', { method: 'Copy' });
      });
    });
  }

  function initEmailButtons() {
    document.querySelectorAll('[data-action="email"]').forEach((button) => {
      button.addEventListener('click', () => {
        const subject = encodeURIComponent('My RetirementSorted results');
        const body = encodeURIComponent(buildShareText());
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        trackEvent('share', { method: 'Email' });
      });
    });
  }

  function initSaveButtons() {
    document.querySelectorAll('[data-action="save"]').forEach((button) => {
      button.addEventListener('click', () => {
        const text = buildShareText();
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'retirementsorted-results.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        trackEvent('share', { method: 'Save' });
      });
    });
  }

  function initResetButtons() {
    document.querySelectorAll('[data-action="reset"]').forEach((button) => {
      button.addEventListener('click', () => {
        const formId = button.getAttribute('data-reset-target');
        const form = formId ? document.getElementById(formId) : button.closest('form');
        if (!form) return;
        form.reset();
        form.querySelectorAll('input[data-currency]').forEach((input) => {
          input.value = '';
        });
        const results = document.querySelector(button.getAttribute('data-results-target'));
        if (results) {
          results.classList.add('hidden');
          results.classList.remove('show');
          results.style.display = 'none';
        }
        const extraTargets = button.getAttribute('data-reset-extra');
        if (extraTargets) {
          extraTargets.split(',').map((target) => target.trim()).forEach((target) => {
            if (!target) return;
            const extra = document.querySelector(target);
            if (extra) {
              extra.style.display = 'none';
              extra.classList.add('hidden');
              extra.classList.remove('show');
            }
          });
        }
      });
    });
  }

  function showError(targetId, message) {
    const target = document.getElementById(targetId);
    if (!target) return;
    if (message) {
      target.textContent = message;
      target.classList.add('is-visible');
    } else {
      target.textContent = '';
      target.classList.remove('is-visible');
    }
  }

  function initAll() {
    initCurrencyInputs();
    initShareButtons();
    initCopyButtons();
    initEmailButtons();
    initSaveButtons();
    initResetButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  window.CalculatorUtils = {
    parseNumber,
    formatCurrency,
    formatPercent,
    getCurrencyValue,
    setCurrencyText,
    trackCalculatorUse,
    showError,
    buildShareText
  };
})();
