import express from 'express';
import { Express } from 'express';
import axios from 'axios';
import cors from 'cors';

/**
 * Sets up a proxy server for the translation API
 * This avoids CORS issues by proxying requests through our own server
 */
export function setupProxyRoutes(app: Express) {
  // Enable CORS for all routes
  app.use(cors());

  // Translation proxy endpoint
  app.post('/api/proxy/translate', async (req, res) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      console.log(`Proxying translation request for: "${text}"`);

      // Forward the request to the translation API
      const response = await axios.post('http://localhost:5000/translate', {
        text
      }, {
        timeout: 60000, // 60 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Return the response from the translation API
      res.json(response.data);
    } catch (error) {
      console.error('Translation proxy error:', error);
      res.status(500).json({ 
        error: 'Failed to translate text',
        message: error.message
      });
    }
  });
}
