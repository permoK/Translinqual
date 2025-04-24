import { Message, WebSocketMessage, TranslationResult, LinguisticInsights } from "@/types";

let socket: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 seconds

// Event handlers
const messageListeners: ((message: Message) => void)[] = [];
const typingListeners: ((status: { conversationId?: number; action?: string }) => void)[] = [];
const translationListeners: ((result: TranslationResult) => void)[] = [];
const insightsListeners: ((result: { text: string; insights: LinguisticInsights }) => void)[] = [];
const connectionListeners: ((connected: boolean) => void)[] = [];
const errorListeners: ((error: string) => void)[] = [];

export function connectWebSocket(): WebSocket {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return socket;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log("WebSocket connection established");
    reconnectAttempts = 0;
    connectionListeners.forEach(listener => listener(true));
  };
  
  socket.onmessage = (event) => {
    try {
      const data: WebSocketMessage = JSON.parse(event.data);
      
      switch (data.type) {
        case "message":
          if (data.message) {
            messageListeners.forEach(listener => listener(data.message!));
          }
          break;
        case "typing":
          typingListeners.forEach(listener => listener({
            conversationId: data.conversationId,
            action: data.action
          }));
          break;
        case "translation":
          translationListeners.forEach(listener => listener({
            originalText: data.originalText!,
            translatedText: data.translatedText!,
            sourceLanguage: data.sourceLanguage!,
            targetLanguage: data.targetLanguage!
          }));
          break;
        case "insights":
          insightsListeners.forEach(listener => listener({
            text: data.text!,
            insights: data.insights!
          }));
          break;
        case "error":
          if (data.error) {
            errorListeners.forEach(listener => listener(data.error!));
          }
          break;
        default:
          console.warn("Unknown message type:", data.type);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };
  
  socket.onclose = (event) => {
    console.log("WebSocket connection closed", event.code, event.reason);
    connectionListeners.forEach(listener => listener(false));
    
    // Attempt to reconnect if not a clean close
    if (event.code !== 1000 && event.code !== 1001) {
      attemptReconnect();
    }
  };
  
  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
    errorListeners.forEach(listener => listener("Connection error"));
  };
  
  return socket;
}

function attemptReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error("Maximum reconnection attempts reached");
    return;
  }
  
  reconnectAttempts++;
  
  setTimeout(() => {
    console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
    connectWebSocket();
  }, RECONNECT_DELAY * reconnectAttempts);
}

export function sendMessage(conversationId: number, content: string, userId: number, language: string) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    const newSocket = connectWebSocket();
    // Wait for connection before sending
    newSocket.addEventListener("open", () => {
      sendMessage(conversationId, content, userId, language);
    });
    return;
  }
  
  const message = {
    type: "message",
    conversationId,
    content,
    userId,
    language
  };
  
  socket.send(JSON.stringify(message));
}

export function closeConnection() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

export function addMessageListener(listener: (message: Message) => void) {
  messageListeners.push(listener);
  return () => {
    const index = messageListeners.indexOf(listener);
    if (index !== -1) {
      messageListeners.splice(index, 1);
    }
  };
}

export function addConnectionListener(listener: (connected: boolean) => void) {
  connectionListeners.push(listener);
  return () => {
    const index = connectionListeners.indexOf(listener);
    if (index !== -1) {
      connectionListeners.splice(index, 1);
    }
  };
}

export function addErrorListener(listener: (error: string) => void) {
  errorListeners.push(listener);
  return () => {
    const index = errorListeners.indexOf(listener);
    if (index !== -1) {
      errorListeners.splice(index, 1);
    }
  };
}

export function addTypingListener(listener: (status: { conversationId?: number; action?: string }) => void) {
  typingListeners.push(listener);
  return () => {
    const index = typingListeners.indexOf(listener);
    if (index !== -1) {
      typingListeners.splice(index, 1);
    }
  };
}

export function addTranslationListener(listener: (result: TranslationResult) => void) {
  translationListeners.push(listener);
  return () => {
    const index = translationListeners.indexOf(listener);
    if (index !== -1) {
      translationListeners.splice(index, 1);
    }
  };
}

export function addInsightsListener(listener: (result: { text: string; insights: LinguisticInsights }) => void) {
  insightsListeners.push(listener);
  return () => {
    const index = insightsListeners.indexOf(listener);
    if (index !== -1) {
      insightsListeners.splice(index, 1);
    }
  };
}

export function requestTranslation(text: string, sourceLanguage: string, targetLanguage: string) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    const newSocket = connectWebSocket();
    newSocket.addEventListener("open", () => {
      requestTranslation(text, sourceLanguage, targetLanguage);
    });
    return;
  }
  
  const request = {
    type: "translate",
    text,
    sourceLanguage,
    targetLanguage
  };
  
  socket.send(JSON.stringify(request));
}

export function requestLinguisticInsights(text: string, language: string) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    const newSocket = connectWebSocket();
    newSocket.addEventListener("open", () => {
      requestLinguisticInsights(text, language);
    });
    return;
  }
  
  const request = {
    type: "insights",
    text,
    language
  };
  
  socket.send(JSON.stringify(request));
}
