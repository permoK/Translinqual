import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupChatRoutes } from "./chat";
import { setupProxyRoutes } from "./proxy";
import { storage } from "./storage";
import { translateText } from "./ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Setup authentication routes
  setupAuth(app);

  // Setup chat and WebSocket routes
  setupChatRoutes(app, httpServer);

  // Setup proxy routes for translation API
  setupProxyRoutes(app);

  // Admin routes for API key management
  app.get("/api/admin/api-keys", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const apiKeys = await storage.getApiKeys();
      res.json(apiKeys);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch API keys", error: error.message });
    }
  });

  app.post("/api/admin/api-keys", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const { provider, keyValue, isActive } = req.body;

      if (!provider || !keyValue) {
        return res.status(400).json({ message: "Provider and key value are required" });
      }

      // Check if provider already exists
      const existingKey = await storage.getApiKeyByProvider(provider);
      if (existingKey) {
        // Update existing key
        const updatedKey = await storage.updateApiKey(existingKey.id, {
          keyValue,
          isActive: isActive !== undefined ? isActive : existingKey.isActive
        });
        return res.json(updatedKey);
      }

      // Create new API key
      const apiKey = await storage.createApiKey({
        provider,
        keyValue,
        isActive: isActive !== undefined ? isActive : true
      });

      res.status(201).json(apiKey);
    } catch (error) {
      res.status(500).json({ message: "Failed to create/update API key", error: error.message });
    }
  });

  app.delete("/api/admin/api-keys/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const id = parseInt(req.params.id);
      await storage.deleteApiKey(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete API key", error: error.message });
    }
  });

  // Admin routes for language management
  app.get("/api/admin/languages", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const languages = await storage.getLanguages();
      res.json(languages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch languages", error: error.message });
    }
  });

  app.post("/api/admin/languages", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const { name, code, isActive, region } = req.body;

      if (!name || !code) {
        return res.status(400).json({ message: "Name and code are required" });
      }

      const language = await storage.createLanguage({
        name,
        code,
        isActive: isActive !== undefined ? isActive : true,
        region
      });

      res.status(201).json(language);
    } catch (error) {
      res.status(500).json({ message: "Failed to create language", error: error.message });
    }
  });

  app.put("/api/admin/languages/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const id = parseInt(req.params.id);
      const { name, code, isActive, region } = req.body;

      const language = await storage.updateLanguage(id, {
        name,
        code,
        isActive,
        region
      });

      if (!language) {
        return res.status(404).json({ message: "Language not found" });
      }

      res.json(language);
    } catch (error) {
      res.status(500).json({ message: "Failed to update language", error: error.message });
    }
  });

  // Admin route to promote a user to admin
  app.post("/api/admin/promote-user", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUser(userId, { role: "admin" });

      // Remove password from response
      const userResponse = { ...updatedUser };
      delete userResponse.password;

      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Failed to promote user", error: error.message });
    }
  });

  return httpServer;
}
