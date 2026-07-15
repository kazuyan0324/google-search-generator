(() => {
  'use strict';

  const form = document.querySelector('#search-form');
  if (!form) return;

  const get = (id) => document.getElementById(id);
  const elements = {
    command: get('search-command'), status: get('status-message'), copy: get('copy-button'),
    search: get('search-button'), reset: get('reset-button')
  };

  const clean = (value) => value.trim().replace(/\s+/g, ' ');
  const lines = (value) => value.split(/[\n,]+/).map(clean).filter(Boolean);
  const words = (value) => value.split(/[\s,]+/).map(clean).filter(Boolean);
  const quote = (value) => `"${value.replace(/["“”]+/g, '').trim()}"`;

  function normalizeDomain(value) {
    let candidate = clean(value);
    if (!candidate) return '';
    if (!/^[a-z][a-z\d+.-]*:\/\//i.test(candidate)) candidate = `https://${candidate}`;
    try {
      return new URL(candidate).hostname.replace(/^www\./i, '').toLowerCase();
    } catch (_) {
      return value.replace(/^[a-z][a-z\d+.-]*:\/\//i, '').replace(/^www\./i, '').split(/[/?#]/)[0].trim().toLowerCase();
    }
  }

  function operator(name, value, exact = false) {
    const normalized = clean(value);
    if (!normalized) return '';
    return `${name}:${exact ? quote(normalized) : normalized}`;
  }

  function buildCommand() {
    const data = new FormData(form);
    const exactTerms = lines(data.get('exact')).map(quote);
    const orTerms = words(data.get('orKeywords'));
    const excluded = words(data.get('exclude')).map((term) => `-${term.replace(/^-+/, '')}`);
    const site = normalizeDomain(data.get('site'));
    const related = normalizeDomain(data.get('related'));
    const parts = [
      clean(data.get('keywords')), ...exactTerms, orTerms.length > 1 ? orTerms.join(' OR ') : (orTerms[0] || ''),
      ...excluded, site ? `site:${site}` : '', data.get('filetype') ? `filetype:${data.get('filetype')}` : '',
      operator('intitle', data.get('intitle'), data.get('intitleExact') === 'on'), operator('inurl', data.get('inurl')),
      operator('intext', data.get('intext'), data.get('intextExact') === 'on'), related ? `related:${related}` : '',
      data.get('after') ? `after:${data.get('after')}` : '', data.get('before') ? `before:${data.get('before')}` : ''
    ];
    return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  function setStatus(message, isError = false) {
    elements.status.textContent = message;
    elements.status.dataset.error = String(isError);
  }

  function update() {
    const command = buildCommand();
    elements.command.textContent = command || '検索条件を入力してください';
    elements.command.dataset.value = command;
    elements.copy.disabled = !command;
    elements.search.disabled = !command;
    setStatus('');
  }

  function fallbackCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const succeeded = document.execCommand('copy');
    area.remove();
    if (!succeeded) throw new Error('copy failed');
  }

  async function copyCommand() {
    const command = elements.command.dataset.value;
    if (!command) return;
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(command);
      else fallbackCopy(command);
      setStatus('コピーしました');
      elements.copy.textContent = 'コピーしました';
      window.setTimeout(() => { elements.copy.textContent = 'コピー'; }, 1800);
    } catch (_) {
      setStatus('コピーできませんでした。検索コマンドを選択してコピーしてください。', true);
    }
  }

  const presets = {
    site: { keywords:'WordPress', site:'example.com' }, pdf: { keywords:'WordPress', filetype:'pdf' },
    exact: { exact:'WordPress 高速化' }, exclude: { keywords:'WordPress', exclude:'求人\nスクール' },
    recent: { keywords:'WordPress', after:'2026-01-01' }
  };

  function applyPreset(name) {
    form.reset();
    Object.entries(presets[name] || {}).forEach(([field, value]) => { form.elements[field].value = value; });
    update();
    elements.command.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  elements.copy.addEventListener('click', copyCommand);
  elements.search.addEventListener('click', () => {
    const command = elements.command.dataset.value;
    if (command) window.open(`https://www.google.com/search?q=${encodeURIComponent(command)}`, '_blank', 'noopener,noreferrer');
  });
  elements.reset.addEventListener('click', () => { form.reset(); update(); form.elements.keywords.focus(); });
  document.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => applyPreset(button.dataset.preset)));
  update();
})();
