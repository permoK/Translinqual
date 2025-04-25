import { storage } from "./storage";
import { translateToLuo, translateFromLuo } from "./luo-model";

// This function generates AI responses for Luo language
export async function sendAiResponse(message: string, language: string): Promise<string> {
  try {
    // For Luo language, we'll translate the message to Luo
    if (language === "luo" && message) {
      const translatedMessage = await translateToLuo(message);
      return translatedMessage;
    } else if (language === "eng" && message) {
      // For English, we'll just return the message
      return message;
    }

    // Default fallback
    return getFallbackResponse(message, language);
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
  }
}

// Function to translate text between languages
export async function translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
  try {
    // For Luo language translation, use our specialized model
    if (sourceLanguage === "eng" && targetLanguage === "luo") {
      return await translateToLuo(text);
    } else if (sourceLanguage === "luo" && targetLanguage === "eng") {
      return await translateFromLuo(text);
    }

    // For unsupported language pairs, return a message
    return `[Translation not available for ${sourceLanguage} to ${targetLanguage}]`;
  } catch (error) {
    console.error("Error translating text:", error);
    return `[Translation error: ${error.message}]`;
  }
}

// Function to get language insights and cultural context
export async function getLinguisticInsights(text: string, language: string): Promise<any> {
  // For now, we'll return basic information about Luo language
  if (language === "luo") {
    return {
      culturalContext: "The Luo people are a Nilotic ethnic group native to western Kenya and northern Tanzania.",
      keyPhrases: ["Misawa (Hello)", "Idhi nade? (How are you?)", "Aber (I'm fine)", "Erokamano (Thank you)"],
      pronunciation: "Luo is a tonal language with distinct vowel sounds."
    };
  }

  // Default response
  return {
    culturalContext: "Cultural context information not available for this language.",
    keyPhrases: [],
    pronunciation: "Pronunciation guide not available for this language."
  };
}

// Fallback responses for when the API is not available or during development
function getFallbackResponse(message: string, language: string): string {
  const lowercaseMessage = message.toLowerCase();

  // Basic greeting detection
  if (lowercaseMessage.includes("hello") ||
      lowercaseMessage.includes("hi") ||
      lowercaseMessage.includes("greetings")) {

    if (language === "luo") {
      return "Misawa! (Hello in Luo/Dholuo) How can I assist you today with Luo language?";
    } else {
      return "Hello! How can I assist you today?";
    }
  }

  // Translation request detection
  if (lowercaseMessage.includes("translate") ||
      lowercaseMessage.includes("how do you say")) {

    if (language === "luo") {
      return "In Luo (Dholuo), common phrases include:\n- Misawa - Hello\n- Idhi nade? - How are you?\n- Aber - I'm fine\n- Erokamano - Thank you\n\nWould you like to learn more specific Luo phrases?";
    } else {
      return "I can help you translate between English and Luo (Dholuo). What would you like to translate?";
    }
  }

  // Cultural information request
  if (lowercaseMessage.includes("culture") ||
      lowercaseMessage.includes("tradition") ||
      lowercaseMessage.includes("custom")) {

    if (language === "luo") {
      return "Luo culture is rich in traditions. The Luo people are a Nilotic ethnic group native to western Kenya and northern Tanzania. They have a strong musical tradition and are known for their storytelling, dance, and fishing culture. Their traditional social structure is organized around kinship, with respect for elders being a central value. Would you like to know more about specific aspects of Luo culture?";
    } else {
      return "The Luo people have a rich cultural heritage with unique traditions and customs. Is there a specific aspect of Luo culture you'd like to learn more about?";
    }
  }

  // Default response
  return "I'm here to help you learn about the Luo (Dholuo) language. You can ask me to translate phrases, teach you about cultural contexts, or provide language learning resources. What would you like to know?";
}
