import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getConversation } from "@/lib/api";
import { connectWebSocket, addMessageListener, closeConnection, sendMessage, addTranslationListener } from "@/lib/socket";
import { Message, TranslationResult } from "@/types";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { DholuoInput } from "./dholuo-input";
import { LanguageSelector } from "@/components/ui/language-selector";
import { Button } from "@/components/ui/button";
import { Loader2, Columns, MoreVertical, ChevronLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";

interface ChatAreaProps {
  onOpenSidebar?: () => void;
}

export function ChatArea({ onOpenSidebar }: ChatAreaProps) {
  const { id } = useParams<{ id: string }>();
  const conversationId = parseInt(id);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSideBySide, setShowSideBySide] = useState(false);
  const [showDholuoInput, setShowDholuoInput] = useState(false);
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/conversations', conversationId],
    queryFn: () => getConversation(conversationId),
    enabled: !!conversationId && !isNaN(conversationId)
  });

  const conversation = data?.conversation;

  // Initialize messages from the query result
  useEffect(() => {
    if (data?.messages) {
      setMessages(data.messages);
    }
  }, [data?.messages]);

  // Set up WebSocket connection for real-time messages
  useEffect(() => {
    const socket = connectWebSocket();

    const removeMessageListener = addMessageListener((message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message]);
      }
    });

    const removeTranslationListener = addTranslationListener((result: TranslationResult) => {
      // Handle translation results
      window.dispatchEvent(new MessageEvent("message", {
        data: {
          type: "translation",
          originalText: result.originalText,
          translatedText: result.translatedText,
          sourceLanguage: result.sourceLanguage,
          targetLanguage: result.targetLanguage
        }
      }));
    });

    return () => {
      removeMessageListener();
      removeTranslationListener();
      closeConnection();
    };
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle translation from Dholuo to English
  const handleTranslationComplete = (originalText: string, translatedText: string) => {
    if (!user || !conversation) return;

    // Send the original Dholuo text as a user message
    sendMessage(conversationId, originalText, user.id, "luo");

    // After a short delay, send the translated text as a system message
    setTimeout(() => {
      // We don't send this through the socket directly, but add it to our local messages
      // This is a special case for the Dholuo input feature
      const translationMessage: Message = {
        id: Date.now(), // Use timestamp as temporary ID
        conversationId,
        content: translatedText,
        isUserMessage: false,
        createdAt: new Date().toISOString(),
        translation: originalText, // Store the original Dholuo text as the translation
        fileUrl: null,
        audioUrl: null
      };

      setMessages(prev => [...prev, translationMessage]);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Conversation not found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">The conversation you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/">
            <Button>Go to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleLanguageChange = (code: string) => {
    // In a real app, we would update the conversation's language in the database
    console.log(`Changed language to ${code}`);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div className="p-4 border-b dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={onOpenSidebar}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="font-medium">{conversation.title}</h3>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Actions */}
        <div className="flex items-center space-x-3">
          {/* Dholuo Input Toggle - only show for Luo language */}
          {conversation.language === "luo" && (
            <Button
              variant={showDholuoInput ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDholuoInput(!showDholuoInput)}
              className={showDholuoInput ? "bg-orange-600 hover:bg-orange-700" : "text-orange-600 border-orange-600 hover:bg-orange-50"}
            >
              {showDholuoInput ? "Hide Dholuo Input" : "Show Dholuo Input"}
            </Button>
          )}

          {/* Language Selector */}
          <LanguageSelector
            selectedLanguage={conversation.language}
            onLanguageChange={handleLanguageChange}
          />

          {/* Side-by-Side Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSideBySide(!showSideBySide)}
            title="Side-by-side view"
          >
            <Columns className="h-4 w-4" />
          </Button>

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-gray-500">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Bookmark Chat</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-gray-500">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Export Conversation</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-gray-500">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Clear History</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin ${showSideBySide ? 'h-1/2' : ''}`}>
        {messages.length === 0 ? (
          <div className="flex justify-center mb-8">
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 max-w-lg">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-bold text-center mb-2">Welcome to Translinqual AI</h2>
              <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                I can help you translate and learn Dholuo. Try asking me something or use the Dholuo input feature!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button variant="outline" className="text-left">
                  <div>
                    <span className="block font-medium">Translate to Dholuo</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Hello, how are you?</span>
                  </div>
                </Button>
                <Button variant="outline" className="text-left">
                  <div>
                    <span className="block font-medium">Teach me common phrases</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">For greetings and introductions</span>
                  </div>
                </Button>
                <Button variant="outline" className="text-left">
                  <div>
                    <span className="block font-medium">Cultural insights</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Tell me about Dholuo traditions</span>
                  </div>
                </Button>
                <Button variant="outline" className="text-left">
                  <div>
                    <span className="block font-medium">Try Dholuo input</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Type in Dholuo and get English translation</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          messages.map(message => (
            <ChatMessage
              key={message.id}
              message={message}
              language={conversation.language}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Side-by-Side View */}
      {showSideBySide && (
        <div className="h-1/2 border-t dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex h-full">
            <div className="w-1/2 border-r dark:border-gray-800 p-4 overflow-y-auto scrollbar-thin">
              <h3 className="font-medium mb-2">Original Text (English)</h3>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p>Hello, how are you?</p>
                <p className="mt-2">I'm learning Dholuo and I find it fascinating. The Luo culture is rich in traditions and customs.</p>
              </div>
            </div>
            <div className="w-1/2 p-4 overflow-y-auto scrollbar-thin">
              <h3 className="font-medium mb-2">Translated Text (Dholuo)</h3>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p>Misawa, idhi nade?</p>
                <p className="mt-2">Apuonjora Dholuo kendo aneno kaka en gima lich. Kit ngima jo-Luo opong' gi timbe kod kit ngima mopogore.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dholuo Input Area - only show when toggled and for Luo language */}
      {showDholuoInput && conversation.language === "luo" && (
        <DholuoInput onTranslationComplete={handleTranslationComplete} />
      )}

      {/* Chat Input Area */}
      <ChatInput
        conversationId={conversationId}
        userId={user?.id || 0}
        language={conversation.language}
      />
    </div>
  );
}
