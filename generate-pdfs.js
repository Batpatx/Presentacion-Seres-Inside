const puppeteer = require('puppeteer');
const path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function generatePDF(htmlFile, pdfFile, totalSlides) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Set viewport to 1920x1080 before navigating
  await page.setViewport({ width: 1920, height: 1080 });

  const filePath = 'file:///' + path.resolve(htmlFile).replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait for images to load
  await sleep(4000);

  // Collect screenshots of each slide
  const screenshots = [];

  for (let i = 0; i < totalSlides; i++) {
    // Navigate to slide i
    await page.evaluate((slideIndex) => {
      const slides = document.querySelectorAll('.slide');
      slides.forEach((s, idx) => {
        s.classList.remove('active');
        if (idx === slideIndex) s.classList.add('active');
      });
      // Force animations to complete
      const active = slides[slideIndex];
      if (active) {
        active.querySelectorAll('.fu').forEach(el => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          el.style.animation = 'none';
        });
      }
    }, i);

    await sleep(600);

    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });
    screenshots.push(screenshot);
    console.log(`  Slide ${i + 1}/${totalSlides} captured`);
  }

  // Now create a PDF with all slides as full-page images
  const pdfPage = await browser.newPage();

  // Build HTML with all screenshots as base64 images
  const imagesHtml = screenshots.map((buf, i) => {
    const b64 = buf.toString('base64');
    return `<div class="page"><img src="data:image/png;base64,${b64}"></div>`;
  }).join('\n');

  const pdfHtml = `<!DOCTYPE html><html><head><style>
    * { margin: 0; padding: 0; }
    @page { size: 1920px 1080px; margin: 0; }
    .page { width: 1920px; height: 1080px; page-break-after: always; overflow: hidden; }
    .page:last-child { page-break-after: auto; }
    .page img { width: 100%; height: 100%; object-fit: contain; display: block; }
  </style></head><body>${imagesHtml}</body></html>`;

  await pdfPage.setContent(pdfHtml, { waitUntil: 'networkidle0' });

  await pdfPage.pdf({
    path: pdfFile,
    width: '1920px',
    height: '1080px',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();
  console.log(`PDF saved: ${pdfFile}`);
}

(async () => {
  try {
    console.log('Generating PDF 1: Propuesta publicitaria...');
    await generatePDF('index.html', 'Seres Inside - Propuesta Publicitaria 2026.pdf', 17);

    console.log('\nGenerating PDF 2: Educación y Sociedad...');
    await generatePDF('educacion-y-sociedad.html', 'Seres Inside - Educacion y Sociedad.pdf', 7);

    console.log('\nDone! Both PDFs generated.');
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
