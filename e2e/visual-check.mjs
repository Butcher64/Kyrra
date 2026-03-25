import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Landing page
await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(2000); // Let animations settle
await page.screenshot({ path: 'design-reference/check-landing-top.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
await page.screenshot({ path: 'design-reference/check-landing-full.png', fullPage: true });

// Check console errors
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

// Login page
await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: 'design-reference/check-login.png' });

// Collect console errors
await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(1000);

console.log('Screenshots saved to design-reference/');
console.log('Console errors:', errors.length ? errors.join('\n') : 'None');

await browser.close();
