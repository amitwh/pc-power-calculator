import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://localhost:4173/');
await page.waitForLoadState('networkidle');
const offenders = await page.evaluate(() => {
  const docW = document.documentElement.clientWidth;
  const out = [];
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.right > docW + 1 || r.left < -1) {
      out.push(`${el.tagName}.${String(el.className).slice(0, 80)} right=${Math.round(r.right)} left=${Math.round(r.left)} w=${Math.round(r.width)}`);
    }
  }
  return { docW, scrollW: document.documentElement.scrollWidth, out: out.slice(0, 25) };
});
console.log(JSON.stringify(offenders, null, 1));
await browser.close();
