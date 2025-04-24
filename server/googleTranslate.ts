import { translate as googleTranslate } from '@vitalets/google-translate-api';
import { storage } from './storage';

/**
 * Translates text using Google Translate without API key
 * Also caches translations in the database for future use
 */
export async function translateWithGoogleTranslate(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  try {
    // Convert language codes to what Google Translate expects
    const fromCode = convertLanguageCode(sourceLanguage);
    const toCode = convertLanguageCode(targetLanguage);

    // Check if we have this translation cached
    const cachedTranslation = await storage.getTranslation(text, sourceLanguage, targetLanguage);
    if (cachedTranslation) {
      console.log('Using cached translation');
      return cachedTranslation.translatedText;
    }

    // Translate using Google Translate
    const { text: translatedText } = await googleTranslate(text, {
      from: fromCode,
      to: toCode
    });

    // Cache the translation for future use
    await storage.createTranslation({
      sourceText: text,
      translatedText,
      sourceLanguage,
      targetLanguage
    });

    return translatedText;
  } catch (error) {
    console.error("Error translating with Google Translate:", error);

    // Return a fallback message in case of error
    return `[Translation error: Could not translate text. Please try again later.]`;
  }
}

/**
 * Converts our language codes to Google Translate language codes
 */
function convertLanguageCode(code: string): string {
  const codeMap: Record<string, string> = {
    'eng': 'en',
    'luo': 'luo' // Google does support Dholuo with code 'luo'
  };

  return codeMap[code] || code;
}
