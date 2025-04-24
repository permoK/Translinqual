import { GoogleGenerativeAI } from "@google/generative-ai";

// Access API key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Create a Gemini client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

// Function to translate text using Gemini model
export async function translateWithGemini(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

    // Create a prompt for translation
    const prompt = `
    Translate the following text from ${sourceLanguage} to ${targetLanguage}. 

    If the source language is English and the target language is Kiswahili, Maasai, or another Kenyan language, 
    ensure correct cultural context is preserved. Similarly, when translating from a Kenyan language to English, 
    provide translation that captures cultural nuances.

    Text to translate: "${text}"
    
    Provide only the translated text without quotes or explanations.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error translating with Gemini:", error);
    
    // Return a fallback message in case of error
    return `[Translation error: Could not translate text. Please try again later.]`;
  }
}

// Function to get linguistic insights and cultural context
export async function getLanguageInsights(
  text: string,
  language: string
): Promise<{
  culturalContext: string;
  keyPhrases: string[];
  pronunciation: string;
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

    // Create a prompt for language insights
    const prompt = `
    Analyze the following text in ${language} and provide linguistic insights:

    Text: "${text}"
    
    Please provide a detailed response in JSON format with the following structure:
    {
      "culturalContext": "Brief explanation of cultural context and relevance",
      "keyPhrases": ["List", "of", "important", "phrases", "or", "terms"],
      "pronunciation": "Guide to pronunciation with phonetic representation"
    }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text().trim();
    
    try {
      // Parse the JSON response
      const parsedResponse = JSON.parse(responseText.replace(/```json|```/g, '').trim());
      return {
        culturalContext: parsedResponse.culturalContext || "Not available",
        keyPhrases: parsedResponse.keyPhrases || [],
        pronunciation: parsedResponse.pronunciation || "Not available"
      };
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      // Return fallback data
      return {
        culturalContext: "Cultural context information not available at the moment.",
        keyPhrases: [],
        pronunciation: "Pronunciation guide not available at the moment."
      };
    }
  } catch (error) {
    console.error("Error getting language insights from Gemini:", error);
    
    // Return fallback data in case of error
    return {
      culturalContext: "Cultural context information not available at the moment.",
      keyPhrases: [],
      pronunciation: "Pronunciation guide not available at the moment."
    };
  }
}

// Function to generate AI response with language awareness
export async function generateResponse(
  message: string,
  language: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

    // Determine language name based on code
    const languageName = 
      language === "mas" ? "Maasai" :
      language === "swa" ? "Kiswahili" :
      language === "kik" ? "Kikuyu" :
      "English";

    // Create a prompt for AI response
    const prompt = `
    You are a culturally aware and helpful assistant that specializes in ${languageName} language and culture.
    Please respond to the following message in ${languageName === "English" ? "English" : "English, followed by a translation in " + languageName}.
    
    If the user's message is in ${languageName} and not English, translate it to English in your response, then answer in both languages.

    Make your response culturally appropriate and educational, teaching aspects of the language naturally through your response.
    If appropriate, mark key terms or phrases with asterisks (*like this*) to highlight important linguistic elements.

    User's message: "${message}"
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error generating response with Gemini:", error);
    
    // Return a fallback message in case of error
    return `I apologize, but I'm having trouble generating a response at the moment. Please try again later.`;
  }
}