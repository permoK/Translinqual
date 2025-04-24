import { storage } from "./storage";
import { translateWithGoogleTranslate } from "./googleTranslate";

// This function generates AI responses using fallback responses
export async function sendAiResponse(message: string, language: string): Promise<string> {
  try {
    // Always use fallback responses instead of Gemini
    return getFallbackResponse(message, language);
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
  }
}

// Function to translate text between languages
export async function translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
  try {
    // Use Google Translate API without API key
    const translatedText = await translateWithGoogleTranslate(text, sourceLanguage, targetLanguage);
    return translatedText;
  } catch (error) {
    console.error("Error translating text:", error);
    return `[Translation error: ${error.message}]`;
  }
}

// Function to get language insights and cultural context
export async function getLinguisticInsights(text: string, language: string): Promise<any> {
  try {
    // Always use fallback insights instead of Gemini
    if (language === "Dholuo" || language === "luo") {
      return {
        culturalContext: "Dholuo is the language of the Luo people, the third largest ethnic group in Kenya, primarily living around Lake Victoria. The language is rich in cultural context related to fishing, music, and community traditions.",
        keyPhrases: ["Misawa", "Idhi nade?", "Ber", "Erokamano"],
        pronunciation: "Dholuo has a tonal system with high, low, and falling tones that can change the meaning of words."
      };
    } else {
      return {
        culturalContext: "English is a global language with many regional variations.",
        keyPhrases: [],
        pronunciation: "English pronunciation varies by region and dialect."
      };
    }
  } catch (error) {
    console.error("Error getting linguistic insights:", error);
    return {
      culturalContext: "An error occurred while retrieving cultural context.",
      keyPhrases: [],
      pronunciation: "An error occurred while retrieving pronunciation guide."
    };
  }
}

// Fallback responses for when the API is not available or during development
function getFallbackResponse(message: string, language: string): string {
  const lowercaseMessage = message.toLowerCase();

  // Basic greeting detection
  if (lowercaseMessage.includes("hello") ||
      lowercaseMessage.includes("hi") ||
      lowercaseMessage.includes("greetings")) {

    if (language === "luo") {
      return "Misawa! (Hello in Dholuo) How can I assist you today with Dholuo language?";
    } else {
      return "Hello! How can I assist you today?";
    }
  }

  // Translation request detection
  if (lowercaseMessage.includes("translate") ||
      lowercaseMessage.includes("how do you say")) {

    if (language === "luo") {
      return "In Dholuo, common phrases include:\n- Misawa - Hello\n- Idhi nade? - How are you?\n- Ber - Good\n- Erokamano - Thank you\n\nWould you like to learn more specific Dholuo phrases?";
    } else {
      return "I can help you translate between English and Dholuo. Please specify what you'd like to translate.";
    }
  }

  // Cultural information request
  if (lowercaseMessage.includes("culture") ||
      lowercaseMessage.includes("tradition") ||
      lowercaseMessage.includes("custom")) {

    if (language === "luo") {
      return "Dholuo culture is rich in traditions. The Luo people are the third largest ethnic group in Kenya, primarily living around Lake Victoria. They have a strong musical tradition and are known for their fishing skills. Family and community are central to Luo culture, with respect for elders being particularly important. Would you like to know more about specific aspects of Dholuo culture?";
    } else {
      return "The Luo are one of Kenya's major ethnic groups. Would you like to learn more about Dholuo culture and traditions?";
    }
  }

  // Default response
  return "I'm here to help you learn about the Dholuo language and culture. You can ask me to translate phrases, teach you about cultural contexts, or provide language learning resources. What would you like to know?";
}
