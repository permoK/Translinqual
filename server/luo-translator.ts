import axios from 'axios';

/**
 * Translation service that uses the local translation API endpoint
 * This connects to the Python-based translation service running at localhost:5000
 * This service uses Selenium to scrape Google Translate for Luo language
 */
export async function translateWithLocalAPI(
  text: string,
  sourceLang: string = 'en',
  targetLang: string = 'luo'
): Promise<string> {
  try {
    console.log(`Requesting translation for: "${text}"`);

    // Make a request to the local translation API
    const response = await axios.post('http://localhost:5000/translate', {
      text: text
    }, {
      timeout: 60000, // 60 second timeout (increased from 10 seconds)
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Check if the response contains a translation
    if (response.data && response.data.translation) {
      const translatedText = response.data.translation;
      console.log(`Translation result from API: "${translatedText}"`);
      return translatedText;
    } else if (response.data && typeof response.data === 'string') {
      // Some APIs might return the translation directly as a string
      console.log(`Translation result from API (string): "${response.data}"`);
      return response.data;
    }

    console.log('Unexpected response format from translation API:', response.data);
    // If we get a response but in an unexpected format, try to extract any useful text
    if (response.data) {
      if (typeof response.data === 'object') {
        // Try to find any property that might contain the translation
        for (const key in response.data) {
          if (typeof response.data[key] === 'string' && response.data[key].length > 0) {
            console.log(`Found potential translation in response.data.${key}: "${response.data[key]}"`);
            return response.data[key];
          }
        }
      }
    }

    // If we couldn't extract anything useful, use our fallback dictionary
    console.log('Could not extract translation from response, using fallback dictionary');
    return useFallbackDictionary(text, sourceLang, targetLang);
  } catch (error) {
    console.error('Translation API error:', error.message);
    console.log('API request failed, falling back to dictionary translation');

    // If the API call fails completely, use our fallback dictionary
    return useFallbackDictionary(text, sourceLang, targetLang);
  }
}

/**
 * Fallback dictionary for when the translation API is unavailable
 */
function useFallbackDictionary(text: string, sourceLang: string, targetLang: string): string {
  console.log(`Using fallback dictionary for: "${text}"`);

  // Check if we have a match in our dictionary
  const lowerText = text.toLowerCase().trim();

  if (sourceLang === 'eng' && targetLang === 'luo') {
    for (const [key, value] of Object.entries(luoDictionary.engToLuo)) {
      if (lowerText.includes(key)) {
        return value;
      }
    }
  } else if (sourceLang === 'luo' && targetLang === 'eng') {
    for (const [key, value] of Object.entries(luoDictionary.luoToEng)) {
      if (lowerText.includes(key)) {
        return value;
      }
    }
  }

  return `[Translation not available. Please try again later.]`;
}

// Luo-specific dictionary for common phrases
// This helps make the translations more accurate for Luo language
const luoDictionary = {
  // English to Luo
  engToLuo: {
    "hello": "misawa",
    "hi": "misawa",
    "how are you": "idhi nade",
    "good morning": "oyawore",
    "good afternoon": "oyasiere",
    "good evening": "oyaotienoni",
    "thank you": "erokamano",
    "goodbye": "oriti",
    "yes": "ee",
    "no": "ooyo",
    "please": "yie akwayi",
    "sorry": "wenwa kowuoro",
    "what is your name": "nyingi en ng'a",
    "my name is": "nyinga en",
    "i love you": "aheri",
    "i am fine": "abet",
    "welcome": "ibirwa",
    "food": "chiemo",
    "water": "pi",
    "house": "ot",
    "family": "anyuola",
    "friend": "osiep",
    "school": "skul",
    "work": "tich",
    "money": "pesa",
    "time": "saa",
    "day": "odiechieng",
    "night": "otieno",
    "today": "kawuono",
    "tomorrow": "kiny",
    "yesterday": "nyoro",
  },
  // Luo to English
  luoToEng: {
    "misawa": "hello",
    "idhi nade": "how are you",
    "oyawore": "good morning",
    "oyasiere": "good afternoon",
    "oyaotienoni": "good evening",
    "erokamano": "thank you",
    "oriti": "goodbye",
    "ee": "yes",
    "ooyo": "no",
    "yie akwayi": "please",
    "wenwa kowuoro": "sorry",
    "nyingi en ng'a": "what is your name",
    "nyinga en": "my name is",
    "aheri": "i love you",
    "abet": "i am fine",
    "ibirwa": "welcome",
    "chiemo": "food",
    "pi": "water",
    "ot": "house",
    "anyuola": "family",
    "osiep": "friend",
    "skul": "school",
    "tich": "work",
    "pesa": "money",
    "saa": "time",
    "odiechieng": "day",
    "otieno": "night",
    "kawuono": "today",
    "kiny": "tomorrow",
    "nyoro": "yesterday",
  }
};

/**
 * Translates text to Luo using ONLY the local translation API
 * The dictionary is only used as a fallback if the API fails
 */
export async function translateToLuo(englishText: string): Promise<string> {
  console.log(`Translating to Luo: "${englishText}"`);

  try {
    // Use the local translation API exclusively
    return await translateWithLocalAPI(englishText, 'eng', 'luo');
  } catch (error) {
    console.error("Error in translateToLuo:", error);
    return "[Translation not available. Please try again later.]";
  }
}

/**
 * Translates text from Luo to English using ONLY the local translation API
 * The dictionary is only used as a fallback if the API fails
 */
export async function translateFromLuo(luoText: string): Promise<string> {
  console.log(`Translating from Luo: "${luoText}"`);

  try {
    // Use the local translation API exclusively
    return await translateWithLocalAPI(luoText, 'luo', 'eng');
  } catch (error) {
    console.error("Error in translateFromLuo:", error);
    return "[Translation not available. Please try again later.]";
  }
}
