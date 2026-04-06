const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const filePath = 'file:///' + path.resolve('prompt-video-ia.html').replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  const totalSlides = await page.evaluate(() => document.querySelectorAll('.slide').length);
  console.log(`Capturing ${totalSlides} slides...`);

  for (let i = 0; i < totalSlides; i++) {
    // Navigate to slide
    await page.evaluate((idx) => {
      const slides = document.querySelectorAll('.slide');
      slides.forEach(s => s.classList.remove('active'));
      slides[idx].classList.add('active');
    }, i);

    // Wait for animations
    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({
      path: `slide_prompt_${i + 1}.png`,
      fullPage: false
    });
    console.log(`  ✓ slide_prompt_${i + 1}.png`);
  }

  await browser.close();
  console.log('Done!');
})();
