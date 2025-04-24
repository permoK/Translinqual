import { User, InsertUser, Conversation, Message, ApiKey, Language, InsertConversation, InsertMessage, InsertApiKey, InsertLanguage } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for the storage
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Conversation operations
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, data: Partial<Conversation>): Promise<Conversation | undefined>;
  deleteConversation(id: number): Promise<boolean>;
  
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByConversationId(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // API Key operations
  getApiKeys(): Promise<ApiKey[]>;
  getApiKeyByProvider(provider: string): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: number, data: Partial<ApiKey>): Promise<ApiKey | undefined>;
  deleteApiKey(id: number): Promise<boolean>;
  
  // Language operations
  getLanguages(): Promise<Language[]>;
  getLanguageByCode(code: string): Promise<Language | undefined>;
  createLanguage(language: InsertLanguage): Promise<Language>;
  updateLanguage(id: number, data: Partial<Language>): Promise<Language | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private apiKeys: Map<number, ApiKey>;
  private languages: Map<number, Language>;
  currentId: { users: number, conversations: number, messages: number, apiKeys: number, languages: number };
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.apiKeys = new Map();
    this.languages = new Map();
    
    this.currentId = {
      users: 1,
      conversations: 1,
      messages: 1,
      apiKeys: 1,
      languages: 1
    };
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Clear expired sessions once per day
    });
    
    // Initialize with default languages
    this.seedLanguages();
  }

  private seedLanguages() {
    const defaultLanguages: InsertLanguage[] = [
      { name: "Maasai", code: "mas", isActive: true, region: "Kenya" },
      { name: "Kiswahili", code: "swa", isActive: true, region: "Kenya" },
      { name: "Kikuyu", code: "kik", isActive: true, region: "Kenya" },
      { name: "Luo", code: "luo", isActive: true, region: "Kenya" },
      { name: "Kamba", code: "kam", isActive: true, region: "Kenya" },
      { name: "English", code: "eng", isActive: true, region: "Global" }
    ];
    
    defaultLanguages.forEach(language => {
      this.createLanguage(language);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const timestamp = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      role: "user",
      avatar: "",
      createdAt: timestamp
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Conversation operations
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(
      conversation => conversation.userId === userId
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createConversation(conversationData: InsertConversation): Promise<Conversation> {
    const id = this.currentId.conversations++;
    const timestamp = new Date();
    const conversation: Conversation = {
      ...conversationData,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: number, data: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = await this.getConversation(id);
    if (!conversation) return undefined;
    
    const updatedConversation = { 
      ...conversation, 
      ...data,
      updatedAt: new Date()
    };
    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }

  async deleteConversation(id: number): Promise<boolean> {
    return this.conversations.delete(id);
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.currentId.messages++;
    const timestamp = new Date();
    const message: Message = {
      ...messageData,
      id,
      createdAt: timestamp
    };
    this.messages.set(id, message);
    
    // Update conversation timestamp
    const conversation = await this.getConversation(messageData.conversationId);
    if (conversation) {
      await this.updateConversation(conversation.id, { updatedAt: timestamp });
    }
    
    return message;
  }

  // API Key operations
  async getApiKeys(): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values());
  }

  async getApiKeyByProvider(provider: string): Promise<ApiKey | undefined> {
    return Array.from(this.apiKeys.values()).find(
      apiKey => apiKey.provider === provider && apiKey.isActive
    );
  }

  async createApiKey(apiKeyData: InsertApiKey): Promise<ApiKey> {
    const id = this.currentId.apiKeys++;
    const timestamp = new Date();
    const apiKey: ApiKey = {
      ...apiKeyData,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.apiKeys.set(id, apiKey);
    return apiKey;
  }

  async updateApiKey(id: number, data: Partial<ApiKey>): Promise<ApiKey | undefined> {
    const apiKey = this.apiKeys.get(id);
    if (!apiKey) return undefined;
    
    const updatedApiKey = { 
      ...apiKey, 
      ...data,
      updatedAt: new Date()
    };
    this.apiKeys.set(id, updatedApiKey);
    return updatedApiKey;
  }

  async deleteApiKey(id: number): Promise<boolean> {
    return this.apiKeys.delete(id);
  }

  // Language operations
  async getLanguages(): Promise<Language[]> {
    return Array.from(this.languages.values());
  }

  async getLanguageByCode(code: string): Promise<Language | undefined> {
    return Array.from(this.languages.values()).find(
      language => language.code === code
    );
  }

  async createLanguage(languageData: InsertLanguage): Promise<Language> {
    const id = this.currentId.languages++;
    const language: Language = {
      ...languageData,
      id
    };
    this.languages.set(id, language);
    return language;
  }

  async updateLanguage(id: number, data: Partial<Language>): Promise<Language | undefined> {
    const language = this.languages.get(id);
    if (!language) return undefined;
    
    const updatedLanguage = { ...language, ...data };
    this.languages.set(id, updatedLanguage);
    return updatedLanguage;
  }
}

export const storage = new MemStorage();
