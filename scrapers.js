const puppeteer = require('puppeteer');

// Browser configuration for Render.com
const getBrowserConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    return {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      headless: 'new'
    };
  }
  return { headless: 'new' };
};

// Steam Scraper
async function searchSteam(gameName) {
  let browser;
  try {
    browser = await puppeteer.launch(getBrowserConfig());
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const searchUrl = `https://store.steampowered.com/search/?term=${encodeURIComponent(gameName)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    const gameData = await page.evaluate(() => {
      const firstResult = document.querySelector('#search_resultsRows > a');
      if (!firstResult) return null;

      const title = firstResult.querySelector('.title')?.textContent?.trim();
      const priceElement = firstResult.querySelector('.discount_final_price, .search_price');
      const price = priceElement?.textContent?.trim() || 'N/A';
      
      const discountElement = firstResult.querySelector('.discount_pct');
      const discount = discountElement?.textContent?.trim()?.replace('-', '').replace('%', '') || null;

      const image = firstResult.querySelector('img')?.src || null;

      // Get platforms
      const platforms = [];
      if (firstResult.querySelector('.platform_img.win')) platforms.push('Windows');
      if (firstResult.querySelector('.platform_img.mac')) platforms.push('Mac');
      if (firstResult.querySelector('.platform_img.linux')) platforms.push('Linux');

      return {
        name: title,
        price: price === 'Free' || price === 'Free to Play' ? 'Free' : price,
        discount: discount,
        image: image,
        platforms: platforms,
        genres: [],
        url: firstResult.href
      };
    });

    await browser.close();
    return gameData;

  } catch (error) {
    console.error('Steam scraping error:', error);
    if (browser) await browser.close();
    return null;
  }
}

// Epic Games Scraper
async function searchEpic(gameName) {
  let browser;
  try {
    browser = await puppeteer.launch(getBrowserConfig());
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const searchUrl = `https://store.epicgames.com/en-US/browse?q=${encodeURIComponent(gameName)}&sortBy=relevancy&sortDir=DESC&count=40`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForTimeout(3000);

    const gameData = await page.evaluate(() => {
      const firstResult = document.querySelector('[data-component="CardGridDesktopBase"] a');
      if (!firstResult) return null;

      const title = firstResult.querySelector('[data-component="Message"]')?.textContent?.trim();
      const priceElement = firstResult.querySelector('[data-component="PriceLayout"]');
      const price = priceElement?.textContent?.trim() || 'N/A';

      const image = firstResult.querySelector('img')?.src || null;

      return {
        name: title,
        price: price === 'Free' ? 'Free' : price,
        discount: null,
        image: image,
        platforms: ['PC'],
        genres: [],
        url: 'https://store.epicgames.com' + firstResult.getAttribute('href')
      };
    });

    await browser.close();
    return gameData;

  } catch (error) {
    console.error('Epic scraping error:', error);
    if (browser) await browser.close();
    return null;
  }
}

// PlayStation Store Scraper
async function searchPlayStation(gameName) {
  let browser;
  try {
    browser = await puppeteer.launch(getBrowserConfig());
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const searchUrl = `https://store.playstation.com/en-us/search/${encodeURIComponent(gameName)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForTimeout(3000);

    const gameData = await page.evaluate(() => {
      const firstResult = document.querySelector('[data-qa="search-results"] section');
      if (!firstResult) return null;

      const title = firstResult.querySelector('[data-qa*="product-name"]')?.textContent?.trim();
      const priceElement = firstResult.querySelector('[data-qa*="price"]');
      const price = priceElement?.textContent?.trim() || 'N/A';

      const image = firstResult.querySelector('img')?.src || null;

      return {
        name: title,
        price: price,
        discount: null,
        image: image,
        platforms: ['PlayStation'],
        genres: [],
        url: null
      };
    });

    await browser.close();
    return gameData;

  } catch (error) {
    console.error('PlayStation scraping error:', error);
    if (browser) await browser.close();
    return null;
  }
}

// Xbox Store Scraper
async function searchXbox(gameName) {
  let browser;
  try {
    browser = await puppeteer.launch(getBrowserConfig());
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const searchUrl = `https://www.xbox.com/en-us/search?q=${encodeURIComponent(gameName)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForTimeout(3000);

    const gameData = await page.evaluate(() => {
      const firstResult = document.querySelector('.ProductCard');
      if (!firstResult) return null;

      const title = firstResult.querySelector('.ProductCard-title')?.textContent?.trim();
      const priceElement = firstResult.querySelector('.ProductCard-price');
      const price = priceElement?.textContent?.trim() || 'N/A';

      const image = firstResult.querySelector('img')?.src || null;

      return {
        name: title,
        price: price,
        discount: null,
        image: image,
        platforms: ['Xbox'],
        genres: [],
        url: null
      };
    });

    await browser.close();
    return gameData;

  } catch (error) {
    console.error('Xbox scraping error:', error);
    if (browser) await browser.close();
    return null;
  }
}

// Nintendo eShop Scraper
async function searchNintendo(gameName) {
  let browser;
  try {
    browser = await puppeteer.launch(getBrowserConfig());
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const searchUrl = `https://www.nintendo.com/us/search/#q=${encodeURIComponent(gameName)}&f:@fnsiteinfo47855573696e74656e646f53776974636886696e74656e646f537769746368=[Nintendo Switch]`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForTimeout(3000);

    const gameData = await page.evaluate(() => {
      const firstResult = document.querySelector('.coveo-result-frame');
      if (!firstResult) return null;

      const title = firstResult.querySelector('.coveo-title')?.textContent?.trim();
      const priceElement = firstResult.querySelector('.coveo-result-cell.price');
      const price = priceElement?.textContent?.trim() || 'N/A';

      const image = firstResult.querySelector('img')?.src || null;

      return {
        name: title,
        price: price,
        discount: null,
        image: image,
        platforms: ['Nintendo Switch'],
        genres: [],
        url: null
      };
    });

    await browser.close();
    return gameData;

  } catch (error) {
    console.error('Nintendo scraping error:', error);
    if (browser) await browser.close();
    return null;
  }
}

module.exports = {
  searchSteam,
  searchEpic,
  searchPlayStation,
  searchXbox,
  searchNintendo
};