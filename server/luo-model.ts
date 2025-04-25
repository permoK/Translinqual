import { HfInference } from '@huggingface/inference';

// Luo language model configuration
const EN_LUO_MODEL = "Helsinki-NLP/opus-mt-en-luo";
const LUO_EN_MODEL = "Helsinki-NLP/opus-mt-mul-en"; // Multilingual to English model

// Initialize the Hugging Face Inference client
// Note: You should set the HUGGINGFACE_API_KEY environment variable
let hf: HfInference | null = null;

try {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (apiKey) {
    hf = new HfInference(apiKey);
    console.log("Hugging Face Inference client initialized successfully");
  } else {
    console.warn("No Hugging Face API key found. Using fallback translations.");
  }
} catch (error) {
  console.error("Error initializing Hugging Face client:", error);
}

// Fallback translations for common phrases
const fallbackTranslations = {
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

// Helper function to check for fallback translations
function checkFallbackTranslation(text: string, dictionary: Record<string, string>): string | null {
  // Convert to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase().trim();

  // Check for exact match
  if (dictionary[lowerText]) {
    return dictionary[lowerText];
  }

  // Check for partial matches (if the input contains a key)
  for (const [key, value] of Object.entries(dictionary)) {
    if (lowerText.includes(key)) {
      return value;
    }
  }

  return null;
}

// Function to translate English text to Luo
export async function translateToLuo(englishText: string): Promise<string> {
  try {
    console.log("Translating to Luo:", englishText);

    // Check for fallback translation first
    const fallbackTranslation = checkFallbackTranslation(englishText, fallbackTranslations.engToLuo);
    if (fallbackTranslation) {
      console.log("Using fallback translation for:", englishText);
      return fallbackTranslation;
    }

    // If no fallback and no API client, return a message
    if (!hf) {
      return `[No translation available for: ${englishText}]`;
    }

    // Use the Hugging Face Inference API for translation
    const response = await hf.translation({
      model: EN_LUO_MODEL,
      inputs: englishText,
    });

    return response.translation_text;
  } catch (error) {
    console.error("Error translating to Luo:", error);

    // Try fallback again in case of error
    const fallbackTranslation = checkFallbackTranslation(englishText, fallbackTranslations.engToLuo);
    if (fallbackTranslation) {
      console.log("Using fallback translation after error for:", englishText);
      return fallbackTranslation;
    }

    return `[Translation not available. Please try a simpler phrase.]`;
  }
}

// Function to translate Luo text to English
export async function translateFromLuo(luoText: string): Promise<string> {
  try {
    console.log("Translating from Luo:", luoText);

    // Check for fallback translation first
    const fallbackTranslation = checkFallbackTranslation(luoText, fallbackTranslations.luoToEng);
    if (fallbackTranslation) {
      console.log("Using fallback translation for:", luoText);
      return fallbackTranslation;
    }

    // If no fallback and no API client, return a message
    if (!hf) {
      return `[No translation available for: ${luoText}]`;
    }

    // Use the Hugging Face Inference API for translation
    const response = await hf.translation({
      model: LUO_EN_MODEL, // Using multilingual to English model
      inputs: luoText,
    });

    return response.translation_text;
  } catch (error) {
    console.error("Error translating from Luo:", error);

    // Try fallback again in case of error
    const fallbackTranslation = checkFallbackTranslation(luoText, fallbackTranslations.luoToEng);
    if (fallbackTranslation) {
      console.log("Using fallback translation after error for:", luoText);
      return fallbackTranslation;
    }

    return `[Translation not available. Please try a simpler phrase.]`;
  }
}
