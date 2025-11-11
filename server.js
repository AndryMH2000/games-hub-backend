const express = require('express');
const cors = require('cors');
const scrapers = require('./scrapers');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    message: 'Games Hub Scraper API',
    version: '1.0.0'
  });
});

// Search game in all stores
app.post('/api/search', async (req, res) => {
  try {
    const { gameName } = req.body;
    
    if (!gameName) {
      return res.status(400).json({ error: 'Game name is required' });
    }

    console.log(`Searching for: ${gameName}`);

    // Search in all stores in parallel
    const results = await Promise.allSettled([
      scrapers.searchSteam(gameName),
      scrapers.searchEpic(gameName),
      scrapers.searchPlayStation(gameName),
      scrapers.searchXbox(gameName),
      scrapers.searchNintendo(gameName)
    ]);

    // Process results
    const gameData = {
      name: gameName,
      stores: {
        steam: results[0].status === 'fulfilled' ? results[0].value : null,
        epic: results[1].status === 'fulfilled' ? results[1].value : null,
        playstation: results[2].status === 'fulfilled' ? results[2].value : null,
        xbox: results[3].status === 'fulfilled' ? results[3].value : null,
        nintendo: results[4].status === 'fulfilled' ? results[4].value : null
      },
      bestPrice: null,
      platforms: [],
      genres: [],
      images: []
    };

    // Find best price and aggregate data
    const validStores = Object.values(gameData.stores).filter(store => store !== null);
    
    if (validStores.length > 0) {
      // Get best price
      const prices = validStores
        .filter(s => s.price !== null && s.price !== 'Free')
        .map(s => parseFloat(s.price.replace(/[^0-9.]/g, '')));
      
      if (prices.length > 0) {
        gameData.bestPrice = `$${Math.min(...prices).toFixed(2)}`;
      }

      // Aggregate platforms (unique)
      gameData.platforms = [...new Set(validStores.flatMap(s => s.platforms || []))];

      // Aggregate genres (unique)
      gameData.genres = [...new Set(validStores.flatMap(s => s.genres || []))];

      // Get images (non-null)
      gameData.images = validStores
        .map(s => s.image)
        .filter(img => img !== null);
    }

    res.json(gameData);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Batch search endpoint
// Batch search endpoint
app.post('/api/batch-search', async (req, res) => {
  try {
    const { games } = req.body;
    
    if (!games || !Array.isArray(games)) {
      return res.status(400).json({ error: 'Games array is required' });
    }

    console.log(`Batch searching ${games.length} games`);

    const results = [];

    // Process games one by one
    for (const gameName of games) {
      try {
        const storesResults = await Promise.allSettled([
          scrapers.searchSteam(gameName),
          scrapers.searchEpic(gameName),
          scrapers.searchPlayStation(gameName),
          scrapers.searchXbox(gameName),
          scrapers.searchNintendo(gameName)
        ]);

        const storeValues = storesResults.map(r => r.status === 'fulfilled' ? r.value : null);

        const gameData = {
          name: gameName,
          stores: {
            steam: storeValues[0],
            epic: storeValues[1],
            playstation: storeValues[2],
            xbox: storeValues[3],
            nintendo: storeValues[4]
          },
          bestPrice: null,
          platforms: [],
          genres: [],
          images: []
        };

        const validStores = Object.values(gameData.stores).filter(s => s !== null);

        if (validStores.length > 0) {
          const prices = validStores
            .filter(s => s.price !== null && s.price !== 'Free')
            .map(s => parseFloat(s.price.replace(/[^0-9.]/g, '')));

          if (prices.length > 0) {
            gameData.bestPrice = `$${Math.min(...prices).toFixed(2)}`;
          }

          gameData.platforms = [...new Set(validStores.flatMap(s => s.platforms || []))];
          gameData.genres = [...new Set(validStores.flatMap(s => s.genres || []))];
          gameData.images = validStores
            .map(s => s.image)
            .filter(img => img !== null);
        }

        results.push(gameData);

        // Delay between games
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err) {
        console.error(`Error processing ${gameName}:`, err);
        results.push({
          name: gameName,
          error: err.message,
          stores: {}
        });
      }
    }

    res.json({ games: results, total: results.length });

  } catch (error) {
    console.error('Batch search error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});
