// We'll use a dictionary-based approach for translation
// This is more reliable than depending on external APIs

console.log("Initializing dictionary-based translation for Luo language");

// Fallback translations for common phrases
const fallbackTranslations = {
  // English to Luo
  engToLuo: {
    // Greetings and basic phrases
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

    // Common nouns
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
    "man": "dichuo",
    "woman": "dhako",
    "child": "nyathi",
    "children": "nyithindo",
    "boy": "wuoyi",
    "girl": "nyako",
    "father": "wuoro",
    "mother": "min",
    "brother": "owadwa",
    "sister": "nyamera",

    // Common verbs
    "to eat": "chiemo",
    "to drink": "metho",
    "to sleep": "nindo",
    "to walk": "wuotho",
    "to run": "ringo",
    "to talk": "wuoyo",
    "to see": "neno",
    "to hear": "winjo",
    "to know": "ng'eyo",
    "to understand": "winjo",
    "to learn": "puonjore",
    "to teach": "puonjo",
    "to work": "tiyo",
    "to play": "tugo",
    "to read": "somo",
    "to write": "ndiko",

    // Common adjectives
    "good": "ber",
    "bad": "rach",
    "big": "duong'",
    "small": "matin",
    "hot": "liet",
    "cold": "ng'ich",
    "new": "manyien",
    "old": "machon",
    "young": "matin",
    "beautiful": "jaber",
    "ugly": "rach",
    "happy": "mor",
    "sad": "sin",
    "sick": "tuo",
    "healthy": "ngima",

    // Numbers
    "one": "achiel",
    "two": "ariyo",
    "three": "adek",
    "four": "ang'wen",
    "five": "abich",
    "six": "auchiel",
    "seven": "abiriyo",
    "eight": "aboro",
    "nine": "ochiko",
    "ten": "apar",

    // Question words
    "what": "ang'o",
    "who": "ng'a",
    "where": "kanye",
    "when": "karang'o",
    "why": "ang'o omiyo",
    "how": "nade",

    // Common phrases
    "i am": "an",
    "you are": "in",
    "he is": "en",
    "she is": "en",
    "we are": "wan",
    "they are": "gin",
    "i want": "adwaro",
    "i need": "achuno",
    "i like": "ahero",
    "i don't like": "ok ahero",
    "i don't know": "ok ang'eyo",
    "i don't understand": "ok awinjo",
    "help me": "konya",
    "speak slowly": "wuo mos",
    "repeat please": "duog chien yie akwayi",
    "how much": "adi",
    "where is": "ere",
    "what time": "saa adi",
    "good night": "oyimore",
    "see you tomorrow": "wanere kiny",
    "nice to meet you": "amor kuomi",
    "how much does it cost": "nengi adi",
    "i am learning luo": "apuonjora dholuo",
    "do you speak english": "iwuoyo gi dholusungu",
    "i don't speak luo well": "ok awuo dholuo maber",
  },

  // Luo to English
  luoToEng: {
    // Greetings and basic phrases
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

    // Common nouns
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
    "dichuo": "man",
    "dhako": "woman",
    "nyathi": "child",
    "nyithindo": "children",
    "wuoyi": "boy",
    "nyako": "girl",
    "wuoro": "father",
    "min": "mother",
    "owadwa": "brother",
    "nyamera": "sister",

    // Common verbs
    "chiemo": "to eat",
    "metho": "to drink",
    "nindo": "to sleep",
    "wuotho": "to walk",
    "ringo": "to run",
    "wuoyo": "to talk",
    "neno": "to see",
    "winjo": "to hear",
    "ng'eyo": "to know",
    "puonjore": "to learn",
    "puonjo": "to teach",
    "tiyo": "to work",
    "tugo": "to play",
    "somo": "to read",
    "ndiko": "to write",

    // Common adjectives
    "ber": "good",
    "rach": "bad",
    "duong'": "big",
    "matin": "small",
    "liet": "hot",
    "ng'ich": "cold",
    "manyien": "new",
    "machon": "old",
    "jaber": "beautiful",
    "mor": "happy",
    "sin": "sad",
    "tuo": "sick",
    "ngima": "healthy",

    // Numbers
    "achiel": "one",
    "ariyo": "two",
    "adek": "three",
    "ang'wen": "four",
    "abich": "five",
    "auchiel": "six",
    "abiriyo": "seven",
    "aboro": "eight",
    "ochiko": "nine",
    "apar": "ten",

    // Question words
    "ang'o": "what",
    "ng'a": "who",
    "kanye": "where",
    "karang'o": "when",
    "ang'o omiyo": "why",
    "nade": "how",

    // Common phrases
    "an": "i am",
    "in": "you are",
    "en": "he/she is",
    "wan": "we are",
    "gin": "they are",
    "adwaro": "i want",
    "achuno": "i need",
    "ahero": "i like",
    "ok ahero": "i don't like",
    "ok ang'eyo": "i don't know",
    "ok awinjo": "i don't understand",
    "konya": "help me",
    "wuo mos": "speak slowly",
    "duog chien yie akwayi": "repeat please",
    "adi": "how much",
    "ere": "where is",
    "saa adi": "what time",
    "oyimore": "good night",
    "wanere kiny": "see you tomorrow",
    "amor kuomi": "nice to meet you",
    "nengi adi": "how much does it cost",
    "apuonjora dholuo": "i am learning luo",
    "iwuoyo gi dholusungu": "do you speak english",
    "ok awuo dholuo maber": "i don't speak luo well",
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

  // For longer phrases, we should be more careful with partial matches
  // Only use partial matches for short phrases or when the key is a substantial part of the text
  if (lowerText.split(' ').length <= 3) {
    // For short phrases, check for partial matches
    for (const [key, value] of Object.entries(dictionary)) {
      // Only match on keys with at least 2 words
      if (key.split(' ').length >= 2 && lowerText.includes(key)) {
        return value;
      }
    }
  }

  // For longer phrases, we'll use Google Translate
  return null;
}

// Advanced dictionary-based translation for English to Luo
export async function translateToLuo(englishText: string): Promise<string> {
  try {
    console.log("Translating to Luo:", englishText);

    // Check for exact match in fallback dictionary
    const fallbackTranslation = checkFallbackTranslation(englishText, fallbackTranslations.engToLuo);
    if (fallbackTranslation) {
      console.log("Using fallback translation for:", englishText);
      return fallbackTranslation;
    }

    // If no exact match, try to translate word by word
    const words = englishText.toLowerCase().split(/\s+/);
    const translatedWords = [];

    for (const word of words) {
      // Check if this word exists in our dictionary
      const cleanWord = word.replace(/[.,!?;:'"()]/g, '');
      const translation = fallbackTranslations.engToLuo[cleanWord];

      if (translation) {
        // If we have a translation, use it
        translatedWords.push(translation);
      } else {
        // If not, keep the original word
        translatedWords.push(word);
      }
    }

    // Join the translated words back together
    let result = translatedWords.join(' ');

    // Apply some basic Luo grammar rules
    result = applyLuoGrammar(result);

    console.log(`Translated "${englishText}" to "${result}" using dictionary`);
    return result;
  } catch (error) {
    console.error("Error translating to Luo:", error);
    return `[Translation not available. Please try a simpler phrase.]`;
  }
}

// Advanced dictionary-based translation for Luo to English
export async function translateFromLuo(luoText: string): Promise<string> {
  try {
    console.log("Translating from Luo:", luoText);

    // Check for exact match in fallback dictionary
    const fallbackTranslation = checkFallbackTranslation(luoText, fallbackTranslations.luoToEng);
    if (fallbackTranslation) {
      console.log("Using fallback translation for:", luoText);
      return fallbackTranslation;
    }

    // If no exact match, try to translate word by word
    const words = luoText.toLowerCase().split(/\s+/);
    const translatedWords = [];

    for (const word of words) {
      // Check if this word exists in our dictionary
      const cleanWord = word.replace(/[.,!?;:'"()]/g, '');
      const translation = fallbackTranslations.luoToEng[cleanWord];

      if (translation) {
        // If we have a translation, use it
        translatedWords.push(translation);
      } else {
        // If not, keep the original word
        translatedWords.push(word);
      }
    }

    // Join the translated words back together
    let result = translatedWords.join(' ');

    // Apply some basic English grammar rules
    result = applyEnglishGrammar(result);

    console.log(`Translated "${luoText}" to "${result}" using dictionary`);
    return result;
  } catch (error) {
    console.error("Error translating from Luo:", error);
    return `[Translation not available. Please try a simpler phrase.]`;
  }
}

// Apply basic Luo grammar rules
function applyLuoGrammar(text: string): string {
  // This is a simplified implementation of Luo grammar rules

  // 1. Replace "I am" with "an"
  text = text.replace(/\bi am\b/gi, "an");

  // 2. Replace "you are" with "in"
  text = text.replace(/\byou are\b/gi, "in");

  // 3. Replace "he is" or "she is" with "en"
  text = text.replace(/\b(he|she) is\b/gi, "en");

  // 4. Replace "we are" with "wan"
  text = text.replace(/\bwe are\b/gi, "wan");

  // 5. Replace "they are" with "gin"
  text = text.replace(/\bthey are\b/gi, "gin");

  // 6. Replace "the" with nothing (Luo doesn't use articles)
  text = text.replace(/\bthe\b/gi, "");

  // 7. Replace "a" or "an" with nothing (Luo doesn't use articles)
  text = text.replace(/\b(a|an)\b/gi, "");

  // 8. Clean up multiple spaces
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

// Apply basic English grammar rules
function applyEnglishGrammar(text: string): string {
  // This is a simplified implementation of English grammar rules

  // 1. Replace "an" at the beginning of a sentence with "I am"
  text = text.replace(/^an\b/i, "I am");
  text = text.replace(/\.\s+an\b/gi, ". I am");

  // 2. Replace "in" at the beginning of a sentence with "You are"
  text = text.replace(/^in\b/i, "You are");
  text = text.replace(/\.\s+in\b/gi, ". You are");

  // 3. Replace "en" at the beginning of a sentence with "He/she is"
  text = text.replace(/^en\b/i, "He/she is");
  text = text.replace(/\.\s+en\b/gi, ". He/she is");

  // 4. Replace "wan" at the beginning of a sentence with "We are"
  text = text.replace(/^wan\b/i, "We are");
  text = text.replace(/\.\s+wan\b/gi, ". We are");

  // 5. Replace "gin" at the beginning of a sentence with "They are"
  text = text.replace(/^gin\b/i, "They are");
  text = text.replace(/\.\s+gin\b/gi, ". They are");

  // 6. Capitalize the first letter of each sentence
  text = text.replace(/(^|\.\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());

  // 7. Clean up multiple spaces
  text = text.replace(/\s+/g, " ").trim();

  return text;
}
