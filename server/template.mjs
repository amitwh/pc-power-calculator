// Branded HTML + plain-text rendering for the notification email.
//
// Rules come from the ConcreteInfo `ci-app-mail` standard: inline styles only
// (clients strip <style>), a table layout capped at 560 px, one orange accent
// on white/greyscale, a CID-embedded logo, and a footer repeated in both parts.
// All user text is escaped before it reaches the HTML.

import { readFileSync } from 'node:fs';
import path from 'node:path';

const ACCENT = '#e5461f';
const INK = '#1c1917';
const GREY = '#464646';
const BORDER = '#e3e3e3';
const WASH = '#f1f1f1';

const LOGO_CANDIDATES = [
  '/usr/share/nginx/html/brand/logo-report.png',
  path.resolve(process.cwd(), 'public/brand/logo-report.png'),
  path.resolve(import.meta.dirname, '..', 'public/brand/logo-report.png'),
];

const SUGGESTION_TYPE_LABELS = {
  'part-correction': 'Correction to an existing part',
  'new-part': 'New part',
  'country-tariff': 'New country or tariff',
  other: 'Something else',
};

const FEEDBACK_TYPE_LABELS = {
  bug: 'Bug report',
  idea: 'Feature idea',
  content: 'Content correction',
  general: 'General feedback',
};

const CATEGORY_LABELS = {
  cpu: 'CPU',
  gpu: 'GPU',
  ram: 'RAM',
  storage: 'Storage',
  motherboard: 'Motherboard',
  psu: 'PSU',
  cooler: 'Cooler',
  fan: 'Fan',
  monitor: 'Monitor',
  'add-in-card': 'Add-in card',
  add_in_card: 'Add-in card',
  optical_drive: 'Optical drive',
  ups: 'UPS',
  peripheral: 'Peripheral',
  not_sure: 'Not sure',
};

const URL_RE = /https?:\/\/[^\s<]+/gi;
const TRAILING_PUNCTUATION = '.,);:!?';

let logoCache;

/** Logo bytes shipped in the image, or null when neither candidate exists. */
export function loadLogo() {
  if (logoCache !== undefined) return logoCache;
  for (const candidate of LOGO_CANDIDATES) {
    try {
      logoCache = { content: readFileSync(candidate), filename: 'logo-report.png' };
      return logoCache;
    } catch {
      // Try the next location.
    }
  }
  logoCache = null;
  return logoCache;
}

export function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
}

/** Turn bare URLs in already-escaped text into accent links. */
export function linkify(escaped) {
  return escaped.replace(URL_RE, (raw) => {
    let url = raw;
    let trailing = '';
    while (url && TRAILING_PUNCTUATION.includes(url[url.length - 1])) {
      trailing = url[url.length - 1] + trailing;
      url = url.slice(0, -1);
    }
    return `<a href="${url}" style="color:${ACCENT};text-decoration:underline;">${url}</a>${trailing}`;
  });
}

function paragraphs(text) {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const escaped = escapeHtml(block).replace(/\n/g, '<br>');
      return `<p style="margin:0 0 16px 0;">${linkify(escaped)}</p>`;
    })
    .join('');
}

function config(overrides = {}) {
  return {
    appName: overrides.appName ?? 'PC Power Calculator',
    appUrl: overrides.appUrl ?? process.env.APP_URL ?? 'https://pcpower.concreteinfo.net',
    supportEmail: overrides.supportEmail ?? process.env.SUPPORT_EMAIL ?? 'support@concreteinfo.in',
    companyUrl: overrides.companyUrl ?? process.env.COMPANY_URL ?? 'https://www.concreteinfo.in',
    linkedinUrl:
      overrides.linkedinUrl ??
      process.env.LINKEDIN_URL ??
      'https://in.linkedin.com/company/concreteinfo',
    youtubeUrl:
      overrides.youtubeUrl ?? process.env.YOUTUBE_URL ?? 'https://www.youtube.com/@concreteinfo6736',
    now: overrides.now ?? new Date(),
  };
}

function fieldsFor(message) {
  const typeLabels = message.kind === 'suggestion' ? SUGGESTION_TYPE_LABELS : FEEDBACK_TYPE_LABELS;
  const fields = [
    { label: 'Type', text: typeLabels[message.type] ?? message.type },
    { label: 'Subject', text: message.subject },
  ];

  if (message.kind === 'suggestion') {
    if (message.category) {
      fields.push({
        label: 'Category',
        text: CATEGORY_LABELS[message.category] ?? message.category,
      });
    }
    if (message.watts !== undefined) {
      fields.push({ label: 'Rated watts', text: `${message.watts} W` });
    }
    if (message.sourceUrl) {
      fields.push({ label: 'Source URL', text: message.sourceUrl, link: true });
    }
  }

  if (message.page) fields.push({ label: 'Page', text: message.page });
  if (message.email) fields.push({ label: 'Reply to', text: message.email });

  return fields;
}

function fieldRow(field) {
  const value = field.link ? linkify(escapeHtml(field.text)) : escapeHtml(field.text);
  return (
    '<tr>'
    + `<td style="padding:10px 12px;border-bottom:1px solid ${BORDER};background-color:${WASH};`
    + `color:${GREY};font-size:13px;font-weight:600;line-height:1.5;vertical-align:top;width:140px;">`
    + `${escapeHtml(field.label)}</td>`
    + `<td style="padding:10px 12px;border-bottom:1px solid ${BORDER};color:${INK};`
    + 'font-size:14px;line-height:1.5;vertical-align:top;">'
    + `${value}</td>`
    + '</tr>'
  );
}

function headerHtml(cfg) {
  const logo = loadLogo();
  if (!logo) {
    return `<span style="color:${INK};font-size:18px;font-weight:700;">${escapeHtml(cfg.appName)}</span>`;
  }
  return (
    `<a href="${escapeHtml(cfg.appUrl)}" style="text-decoration:none;">`
    + `<img src="cid:logo" width="150" height="50" alt="${escapeHtml(cfg.appName)}" `
    + 'style="display:block;border:0;max-width:100%;height:auto;">'
    + '</a>'
  );
}

function footerHtml(cfg) {
  const year = cfg.now.getUTCFullYear();
  const link = (href, text, color = GREY) =>
    `<a href="${escapeHtml(href)}" style="color:${color};text-decoration:underline;">`
    + `${escapeHtml(text)}</a>`;
  return (
    '<tr><td style="padding:20px 32px 28px 32px;border-top:1px solid '
    + `${BORDER};color:${GREY};font-size:12px;line-height:1.8;">`
    + `<a href="${escapeHtml(cfg.appUrl)}" style="color:${ACCENT};text-decoration:none;">`
    + `${escapeHtml(cfg.appName)}</a><br>`
    + link(cfg.companyUrl, 'ConcreteInfo — www.concreteinfo.in')
    + ' &nbsp;·&nbsp; '
    + link(`mailto:${cfg.supportEmail}`, `Support: ${cfg.supportEmail}`)
    + '<br>'
    + link(cfg.linkedinUrl, 'LinkedIn')
    + ' &nbsp;·&nbsp; '
    + link(cfg.youtubeUrl, 'YouTube')
    + `<br>© ${year} ConcreteInfo`
    + '</td></tr>'
  );
}

function bodySection(message) {
  const label = message.kind === 'suggestion' ? 'Details' : 'Message';
  const text = message.kind === 'suggestion' ? message.details : message.message;
  return (
    `<h2 style="margin:0 0 10px 0;color:${INK};font-size:15px;font-weight:700;">`
    + `${label}</h2>`
    + `<div style="color:${INK};font-size:15px;line-height:1.6;">${paragraphs(text)}</div>`
  );
}

/** Plain-text alternative carrying the same fields and footer links. */
export function renderText(message, overrides = {}) {
  const cfg = config(overrides);
  const fields = fieldsFor(message).map((field) => `${field.label}: ${field.text}`);
  const bodyLabel = message.kind === 'suggestion' ? 'Details' : 'Message';
  const body = message.kind === 'suggestion' ? message.details : message.message;

  return [
    `New ${message.kind} — ${cfg.appName}`,
    '',
    ...fields,
    '',
    `${bodyLabel}:`,
    '',
    body,
    '',
    '—',
    `${cfg.appName}: ${cfg.appUrl}`,
    `ConcreteInfo: ${cfg.companyUrl}`,
    `Support: ${cfg.supportEmail}`,
    `LinkedIn: ${cfg.linkedinUrl}`,
    `YouTube: ${cfg.youtubeUrl}`,
    `© ${cfg.now.getUTCFullYear()} ConcreteInfo`,
  ].join('\n');
}

/** HTML part with the branded shell. No <style> block; every rule is inline. */
export function renderHtml(message, overrides = {}) {
  const cfg = config(overrides);
  const table = fieldsFor(message).map(fieldRow).join('');

  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background-color:${WASH};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${WASH};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid ${BORDER};border-radius:8px;">
<tr><td style="padding:28px 32px 12px 32px;">${headerHtml(cfg)}</td></tr>
<tr><td style="padding:0 32px 20px 32px;border-bottom:3px solid ${ACCENT};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:24px 32px 4px 32px;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid ${BORDER};border-radius:6px;margin:0 0 20px 0;">
${table}
</table>
${bodySection(message)}
</td></tr>
${footerHtml(cfg)}
</table>
</td></tr></table>
</body></html>`;
}

/**
 * Full message: subject line, both parts, and the logo attachment (or null when
 * the image is not shipped, in which case the HTML shows the app name instead).
 */
export function renderMessage(message, overrides = {}) {
  const kindLabel = message.kind === 'suggestion' ? 'Suggestion' : 'Feedback';
  const logo = loadLogo();
  return {
    subject: `[PC Power] ${kindLabel} — ${message.subject}`,
    text: renderText(message, overrides),
    html: renderHtml(message, overrides),
    logo,
  };
}
