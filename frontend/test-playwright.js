import { chromium } from 'playwright';

(async () => {
  try {
    console.log('Launching browser (with UI)...');
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    console.log('Navigating to google.com...');
    await page.goto('https://www.google.com');
    const title = await page.title();
    console.log('Page title:', title);
    console.log('Waiting for 10 seconds so you can see it...');
    await new Promise(r => setTimeout(r, 10000));
    await browser.close();
    console.log('Playwright is working perfectly!');
  } catch (error) {
    console.error('Error running Playwright:', error);
  }
})();
