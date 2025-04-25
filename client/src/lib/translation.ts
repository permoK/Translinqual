/**
 * Translation service for handling communication with the translation API
 */

/**
 * Translates text using our proxy endpoint
 * This function handles the communication with the translation API through our proxy
 *
 * @param text The text to translate
 * @returns The translated text or an error message
 */
export async function translateText(text: string): Promise<string> {
  try {
    // Use our proxy endpoint to avoid CORS issues
    const response = await fetch('/api/proxy/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text
      })
    });

    if (!response.ok) {
      throw new Error(`Translation failed with status: ${response.status}`);
    }

    const data = await response.json();

    // The translation API returns { translated: "..." }
    if (data.translated) {
      return data.translated;
    } else {
      console.warn('Unexpected response format:', data);
      // Try to find any property that might contain the translation
      for (const key in data) {
        if (typeof data[key] === 'string' && data[key].length > 0) {
          return data[key];
        }
      }
      throw new Error('Could not extract translation from response');
    }
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}
