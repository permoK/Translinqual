import express, { Express } from "express";
import { WebSocketServer } from "ws";
import { Server } from "http";
import { storage } from "./storage";
import { sendAiResponse, translateText, getLinguisticInsights } from "./ai";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${randomUUID()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage: fileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only certain file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, PNG, and TXT files are allowed.'), false);
    }
  }
});

export function setupChatRoutes(app: Express, server: Server) {
  // Create WebSocket server
  const wss = new WebSocketServer({ server, path: "/ws" });
  
  // WebSocket connection handler
  wss.on("connection", (ws) => {
    console.log("New WebSocket connection established");
    
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === "message") {
          // Handle chat message
          const { conversationId, content, userId, language } = data;
          
          // Let the client know we're processing
          ws.send(JSON.stringify({
            type: "typing",
            conversationId
          }));
          
          // Store user message
          const userMessage = await storage.createMessage({
            conversationId,
            content,
            isUserMessage: true,
            translation: null,
            fileUrl: null,
            audioUrl: null
          });
          
          // Send message back to confirm receipt
          ws.send(JSON.stringify({
            type: "message",
            message: userMessage
          }));
          
          // Generate AI response
          const aiResponse = await sendAiResponse(content, language);
          
          // Get translation if needed (for non-English responses)
          let translation = null;
          if (language !== "eng") {
            try {
              // Only translate if the response contains text in the target language
              // This is a simplistic check; a real implementation would use language detection
              if (aiResponse.length > 50) { // Assuming longer responses have both languages
                // Try to extract the translated part using a pattern
                const languageName = 
                  language === "mas" ? "Maasai" :
                  language === "swa" ? "Kiswahili" :
                  language === "kik" ? "Kikuyu" : null;
                
                if (languageName) {
                  // This is just a simple approach - in a production app, you'd want 
                  // more sophisticated parsing or have the AI return structured data
                  translation = await translateText(aiResponse, languageName, "English");
                }
              }
            } catch (translationError) {
              console.error("Translation error:", translationError);
              // Continue without translation if it fails
            }
          }
          
          // Get linguistic insights
          let insights = null;
          try {
            if (language !== "eng") {
              const languageName = 
                language === "mas" ? "Maasai" :
                language === "swa" ? "Kiswahili" :
                language === "kik" ? "Kikuyu" : "English";
              
              insights = await getLinguisticInsights(aiResponse, languageName);
            }
          } catch (insightsError) {
            console.error("Insights error:", insightsError);
            // Continue without insights if it fails
          }
          
          // Store AI response
          const aiMessage = await storage.createMessage({
            conversationId,
            content: aiResponse,
            isUserMessage: false,
            translation, // May be null if no translation
            fileUrl: null,
            audioUrl: null
          });
          
          // Add insights to the message if available
          const messageWithInsights = insights ? { ...aiMessage, insights } : aiMessage;
          
          // Send AI response back to client
          ws.send(JSON.stringify({
            type: "message",
            message: messageWithInsights
          }));
        }
        else if (data.type === "translate") {
          // Handle translation request
          const { text, sourceLanguage, targetLanguage } = data;
          
          // Let the client know we're processing
          ws.send(JSON.stringify({
            type: "typing",
            action: "translating"
          }));
          
          // Perform translation
          const translatedText = await translateText(text, sourceLanguage, targetLanguage);
          
          // Send translation back to client
          ws.send(JSON.stringify({
            type: "translation",
            originalText: text,
            translatedText,
            sourceLanguage,
            targetLanguage
          }));
        }
        else if (data.type === "insights") {
          // Handle linguistic insights request
          const { text, language } = data;
          
          // Let the client know we're processing
          ws.send(JSON.stringify({
            type: "typing",
            action: "analyzing"
          }));
          
          // Get linguistic insights
          const insights = await getLinguisticInsights(text, language);
          
          // Send insights back to client
          ws.send(JSON.stringify({
            type: "insights",
            text,
            insights
          }));
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({
          type: "error",
          message: "An error occurred processing your message"
        }));
      }
    });
    
    ws.on("close", () => {
      console.log("WebSocket connection closed");
    });
  });

  // API Endpoints for conversations
  app.get("/api/conversations", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const conversations = await storage.getConversationsByUserId(req.user.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations", error: error.message });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const { title, language } = req.body;
      
      if (!title || !language) {
        return res.status(400).json({ message: "Title and language are required" });
      }
      
      const conversation = await storage.createConversation({
        userId: req.user.id,
        title,
        language
      });
      
      res.status(201).json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Failed to create conversation", error: error.message });
    }
  });

  app.get("/api/conversations/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      if (conversation.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const messages = await storage.getMessagesByConversationId(conversationId);
      
      res.json({
        conversation,
        messages
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversation", error: error.message });
    }
  });

  app.delete("/api/conversations/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      if (conversation.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteConversation(conversationId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete conversation", error: error.message });
    }
  });

  app.put("/api/conversations/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const conversationId = parseInt(req.params.id);
      const { title, language } = req.body;
      
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      if (conversation.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedConversation = await storage.updateConversation(conversationId, {
        title,
        language
      });
      
      res.json(updatedConversation);
    } catch (error) {
      res.status(500).json({ message: "Failed to update conversation", error: error.message });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const fileUrl = `/uploads/${req.file.filename}`;
      
      res.status(201).json({
        fileUrl,
        filename: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload file", error: error.message });
    }
  });

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    next();
  }, express.static(uploadDir));

  // Languages API
  app.get("/api/languages", async (_req, res) => {
    try {
      const languages = await storage.getLanguages();
      res.json(languages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch languages", error: error.message });
    }
  });

  // Translation API
  app.post("/api/translate", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const { text, sourceLanguage, targetLanguage } = req.body;
      
      if (!text || !sourceLanguage || !targetLanguage) {
        return res.status(400).json({ message: "Text, sourceLanguage, and targetLanguage are required" });
      }
      
      const translatedText = await translateText(text, sourceLanguage, targetLanguage);
      res.json({ originalText: text, translatedText });
    } catch (error) {
      res.status(500).json({ message: "Failed to translate text", error: (error as Error).message });
    }
  });

  // Linguistic Insights API
  app.post("/api/linguistic-insights", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const { text, language } = req.body;
      
      if (!text || !language) {
        return res.status(400).json({ message: "Text and language are required" });
      }
      
      const insights = await getLinguisticInsights(text, language);
      res.json({ text, insights });
    } catch (error) {
      res.status(500).json({ message: "Failed to get linguistic insights", error: (error as Error).message });
    }
  });
}
