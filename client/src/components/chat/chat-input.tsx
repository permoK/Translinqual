import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoiceRecorder } from "@/components/ui/voice-recorder";
import { DrawingPad } from "@/components/ui/drawing-pad";
import { FileUpload } from "@/components/ui/file-upload";
import { sendMessage } from "@/lib/socket";
import { startSpeechRecognition, speakText } from "@/lib/speech";
import { useToast } from "@/hooks/use-toast";
import {
  Bold, Italic, Link, Mic, Send, Image, FileText,
  Code, PencilLine, Maximize2, Minimize2, ChevronUp, ChevronDown, Loader2
} from "lucide-react";

// Debounce function to limit API calls
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function(...args: Parameters<T>): void {
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

interface ChatInputProps {
  conversationId: number;
  userId: number;
  language: string;
}

export function ChatInput({ conversationId, userId, language }: ChatInputProps) {
  const [englishMessage, setEnglishMessage] = useState("");
  const [luoMessage, setLuoMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showDrawingPad, setShowDrawingPad] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded for split view
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const englishTextareaRef = useRef<HTMLTextAreaElement>(null);
  const luoTextareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const translationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  // Track network status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      // Clean up any pending translation timeout
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }
    };
  }, []);

  // Focus English textarea on mount
  useEffect(() => {
    if (englishTextareaRef.current) {
      englishTextareaRef.current.focus();
    }
  }, []);

  // Handle clicking outside the input to close toolbar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputContainerRef.current &&
        !inputContainerRef.current.contains(event.target as Node) &&
        isToolbarVisible
      ) {
        setIsToolbarVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isToolbarVisible]);

  const handleSendMessage = () => {
    // Check if we have content in either language
    const hasEnglishContent = englishMessage.trim().length > 0;
    const hasLuoContent = luoMessage.trim().length > 0;

    // At least one language must have content
    if ((!hasEnglishContent && !hasLuoContent) || isSending) return;

    if (isOffline) {
      // Store message locally for later sending
      toast({
        title: "You're offline",
        description: "Your message will be sent when you're back online",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    // Send with a slight animation delay to show the sending state
    setTimeout(async () => {
      try {
        // If both languages have content, send the English message with Luo translation
        if (hasEnglishContent && hasLuoContent) {
          // Send the English message with its Luo translation
          sendMessage(conversationId, englishMessage.trim(), userId, "eng", luoMessage.trim());
        }
        // If only English has content, translate it to Luo first
        else if (hasEnglishContent) {
          try {
            // Get Luo translation
            const response = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: englishMessage.trim(),
                sourceLanguage: 'eng',
                targetLanguage: 'luo'
              })
            });

            if (response.ok) {
              const data = await response.json();
              // Send the English message with its Luo translation
              sendMessage(conversationId, englishMessage.trim(), userId, "eng", data.translatedText);
            } else {
              // If translation fails, just send the English message
              sendMessage(conversationId, englishMessage.trim(), userId, "eng");
            }
          } catch (error) {
            console.error("Translation error:", error);
            // If translation fails, just send the English message
            sendMessage(conversationId, englishMessage.trim(), userId, "eng");
          }
        }
        // If only Luo has content, translate it to English first
        else if (hasLuoContent) {
          try {
            // Get English translation
            const response = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: luoMessage.trim(),
                sourceLanguage: 'luo',
                targetLanguage: 'eng'
              })
            });

            if (response.ok) {
              const data = await response.json();
              // Send the Luo message with its English translation
              sendMessage(conversationId, luoMessage.trim(), userId, "luo", data.translatedText);
            } else {
              // If translation fails, just send the Luo message
              sendMessage(conversationId, luoMessage.trim(), userId, "luo");
            }
          } catch (error) {
            console.error("Translation error:", error);
            // If translation fails, just send the Luo message
            sendMessage(conversationId, luoMessage.trim(), userId, "luo");
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        toast({
          title: "Error sending message",
          description: "Please try again",
          variant: "destructive"
        });
      } finally {
        // Clear both input fields
        setEnglishMessage("");
        setLuoMessage("");
        setIsSending(false);

        // Resize the textareas back to initial size
        if (englishTextareaRef.current) {
          englishTextareaRef.current.style.height = "auto";
        }
        if (luoTextareaRef.current) {
          luoTextareaRef.current.style.height = "auto";
        }
      }
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, isEnglish: boolean) => {
    // Send message on Enter (without shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }

    // New paragraph on Shift+Enter is allowed naturally

    // Expand on arrow up if at the start of input
    if (e.key === 'ArrowUp') {
      const ref = isEnglish ? englishTextareaRef : luoTextareaRef;
      if (ref.current?.selectionStart === 0) {
        setIsExpanded(true);
      }
    }
  };

  // Handle English textarea changes
  const handleEnglishChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setEnglishMessage(newText);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";

    // Set a max height before scrolling
    const maxHeight = 200;
    if (textarea.scrollHeight > maxHeight) {
      textarea.style.height = `${maxHeight}px`;
    } else {
      textarea.style.height = `${textarea.scrollHeight}px`;
    }

    // Show toolbar when user starts typing
    if (!isToolbarVisible && newText) {
      setIsToolbarVisible(true);
    }

    // We'll disable auto-translation to make the UI more predictable
    // Users can click the translate button when they're ready

    // Clear Luo text if English is empty
    if (!newText.trim()) {
      setLuoMessage("");
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
        translationTimeoutRef.current = null;
      }
    }
  };

  // Handle Luo textarea changes
  const handleLuoChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setLuoMessage(newText);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";

    // Set a max height before scrolling
    const maxHeight = 200;
    if (textarea.scrollHeight > maxHeight) {
      textarea.style.height = `${maxHeight}px`;
    } else {
      textarea.style.height = `${textarea.scrollHeight}px`;
    }

    // Show toolbar when user starts typing
    if (!isToolbarVisible && newText) {
      setIsToolbarVisible(true);
    }

    // We'll disable auto-translation to make the UI more predictable
    // Users can click the translate button when they're ready

    // Clear English text if Luo is empty
    if (!newText.trim()) {
      setEnglishMessage("");
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
        translationTimeoutRef.current = null;
      }
    }
  };

  const handleStartVoiceRecording = () => {
    setIsRecording(true);
  };

  const handleStopVoiceRecording = (audioBlob: Blob, audioUrl: string) => {
    // In a real app, we would upload the audio file and add it to the chat
    toast({
      title: "Voice recording completed",
      description: "Your voice message is ready to send",
    });

    setIsRecording(false);
  };

  const handleCancelVoiceRecording = () => {
    setIsRecording(false);
  };

  const handleDrawingComplete = (imageData: string) => {
    // In a real app, we would upload the drawing and add it to the chat
    toast({
      title: "Drawing recognized",
      description: "Your handwritten input has been processed",
    });

    setShowDrawingPad(false);
  };

  const handleFileUploaded = (fileUrl: string, fileName: string, isEnglish: boolean = true) => {
    // Add file reference to the message
    const fileMessage = `[File: ${fileName}](${fileUrl})`;

    if (isEnglish) {
      setEnglishMessage(prevMessage => prevMessage ? `${prevMessage}\n${fileMessage}` : fileMessage);
    } else {
      setLuoMessage(prevMessage => prevMessage ? `${prevMessage}\n${fileMessage}` : fileMessage);
    }
  };

  const formatText = (format: 'bold' | 'italic' | 'link' | 'code', isEnglish: boolean = true) => {
    // Get the appropriate textarea and message
    const textareaRef = isEnglish ? englishTextareaRef : luoTextareaRef;
    const message = isEnglish ? englishMessage : luoMessage;
    const setMessage = isEnglish ? setEnglishMessage : setLuoMessage;

    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = message.substring(start, end);

    let replacement = '';
    let cursorPosition = 0;

    switch (format) {
      case 'bold':
        replacement = `**${selected}**`;
        cursorPosition = start + 2;
        break;
      case 'italic':
        replacement = `*${selected}*`;
        cursorPosition = start + 1;
        break;
      case 'link':
        replacement = `[${selected}](url)`;
        cursorPosition = end + 3;
        break;
      case 'code':
        replacement = `\`${selected}\``;
        cursorPosition = start + 1;
        break;
    }

    const newMessage = message.substring(0, start) + replacement + message.substring(end);
    setMessage(newMessage);

    // Set focus back to textarea and put cursor in the right position
    setTimeout(() => {
      textarea.focus();
      if (selected) {
        textarea.selectionStart = start;
        textarea.selectionEnd = start + replacement.length;
      } else {
        textarea.selectionStart = cursorPosition;
        textarea.selectionEnd = cursorPosition;
      }
    }, 0);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);

    if (!isExpanded) {
      // Focus the English textarea when expanding
      setTimeout(() => {
        if (englishTextareaRef.current) {
          englishTextareaRef.current.focus();
        }
      }, 0);
    }
  };

  return (
    <div className="border-t dark:border-gray-800 bg-white dark:bg-gray-900 p-3 md:p-4 transition-all duration-200">
      {/* Drawing Pad */}
      {showDrawingPad && (
        <DrawingPad
          onSave={handleDrawingComplete}
          onClose={() => setShowDrawingPad(false)}
        />
      )}

      {/* Voice Recording Interface */}
      {isRecording && (
        <VoiceRecorder
          isRecording={isRecording}
          onStartRecording={handleStartVoiceRecording}
          onStopRecording={handleStopVoiceRecording}
          onCancelRecording={handleCancelVoiceRecording}
        />
      )}

      {/* Modern Input Box */}
      <div
        ref={inputContainerRef}
        className={`max-w-4xl mx-auto transition-all duration-300 ease-in-out ${isExpanded ? 'mb-6' : ''}`}
      >
        <div className="flex items-start md:items-end">
          <div
            className={`relative flex-1 border dark:border-gray-700 rounded-2xl shadow-sm bg-white dark:bg-gray-800 transition-all duration-200
              ${isExpanded ? 'shadow-md' : ''}`}
          >
            {/* Expand/Collapse Button (only visible when expanded) */}
            {isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpand}
                className="absolute -top-8 right-2 h-7 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ChevronDown className="h-4 w-4 mr-1" />
                <span>Collapse</span>
              </Button>
            )}

            {/* Toolbar - only visible when expanded or actively showing */}
            {(isExpanded || isToolbarVisible) && (
              <div
                className={`flex items-center p-2 border-b dark:border-gray-700 rounded-t-2xl bg-gray-50 dark:bg-gray-800
                  transition-opacity duration-200 ${isToolbarVisible ? 'opacity-100' : 'opacity-0'}`}
              >
                <div className="flex space-x-1 overflow-x-auto scrollbar-none">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => formatText('bold')}
                    className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => formatText('italic')}
                    className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    title="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => formatText('code')}
                    className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    title="Inline Code"
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => formatText('link')}
                    className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    title="Link"
                  >
                    <Link className="h-4 w-4" />
                  </Button>
                </div>

                <div className="h-5 border-r dark:border-gray-700 mx-2 hidden md:block"></div>

                <div className="hidden md:flex space-x-1">
                  {/* File Upload */}
                  <FileUpload onUpload={handleFileUploaded}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      title="Upload File"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </FileUpload>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDrawingPad(!showDrawingPad)}
                    className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    title="Drawing"
                  >
                    <PencilLine className="h-4 w-4" />
                  </Button>
                </div>

                <div className="ml-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleExpand}
                    className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    title={isExpanded ? "Minimize" : "Maximize"}
                  >
                    {isExpanded ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Split Text Input */}
            <div className="p-3">
              {/* Language labels */}
              <div className="flex justify-between mb-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">English</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Luo (Dholuo)</span>
              </div>

              {/* Split text areas */}
              <div className="flex space-x-4">
                {/* English input */}
                <div className="flex-1">
                  <Textarea
                    ref={englishTextareaRef}
                    placeholder="Type in English..."
                    value={englishMessage}
                    onChange={handleEnglishChange}
                    onKeyDown={(e) => handleKeyDown(e, true)}
                    onClick={() => !isToolbarVisible && setIsToolbarVisible(true)}
                    className={`w-full border-0 focus-visible:ring-0 resize-none bg-transparent outline-none
                      text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500
                      transition-all duration-200 ${isExpanded ? 'min-h-[120px]' : ''}`}
                    rows={isExpanded ? 4 : 1}
                  />
                </div>

                {/* Translation button in the middle */}
                <div className="flex flex-col justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (englishMessage.trim()) {
                        // Translate English to Luo
                        setIsTranslating(true);
                        try {
                          toast({
                            title: "Translating...",
                            description: "English to Luo translation in progress",
                          });

                          const response = await fetch('/api/translate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              text: englishMessage,
                              sourceLanguage: 'eng',
                              targetLanguage: 'luo'
                            })
                          });

                          if (response.ok) {
                            const data = await response.json();
                            console.log("Translation result:", data);

                            if (data.translatedText) {
                              setLuoMessage(data.translatedText);

                              toast({
                                title: "Translation Complete",
                                description: `"${englishMessage}" → "${data.translatedText}"`,
                              });

                              // Resize the Luo textarea
                              if (luoTextareaRef.current) {
                                luoTextareaRef.current.style.height = "auto";
                                luoTextareaRef.current.style.height =
                                  Math.min(luoTextareaRef.current.scrollHeight, 200) + "px";
                              }
                            }
                          } else {
                            toast({
                              title: "Translation Failed",
                              description: "Could not translate text. Please try again.",
                              variant: "destructive"
                            });
                          }
                        } catch (error) {
                          console.error("Translation error:", error);
                          toast({
                            title: "Translation Error",
                            description: "An error occurred during translation",
                            variant: "destructive"
                          });
                        } finally {
                          setIsTranslating(false);
                        }
                      } else if (luoMessage.trim()) {
                        // Translate Luo to English
                        setIsTranslating(true);
                        try {
                          toast({
                            title: "Translating...",
                            description: "Luo to English translation in progress",
                          });

                          const response = await fetch('/api/translate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              text: luoMessage,
                              sourceLanguage: 'luo',
                              targetLanguage: 'eng'
                            })
                          });

                          if (response.ok) {
                            const data = await response.json();
                            console.log("Translation result:", data);

                            if (data.translatedText) {
                              setEnglishMessage(data.translatedText);

                              toast({
                                title: "Translation Complete",
                                description: `"${luoMessage}" → "${data.translatedText}"`,
                              });

                              // Resize the English textarea
                              if (englishTextareaRef.current) {
                                englishTextareaRef.current.style.height = "auto";
                                englishTextareaRef.current.style.height =
                                  Math.min(englishTextareaRef.current.scrollHeight, 200) + "px";
                              }
                            }
                          } else {
                            toast({
                              title: "Translation Failed",
                              description: "Could not translate text. Please try again.",
                              variant: "destructive"
                            });
                          }
                        } catch (error) {
                          console.error("Translation error:", error);
                          toast({
                            title: "Translation Error",
                            description: "An error occurred during translation",
                            variant: "destructive"
                          });
                        } finally {
                          setIsTranslating(false);
                        }
                      }
                    }}
                    className="px-2 py-1 flex items-center justify-center gap-1"
                    disabled={isTranslating || (!englishMessage.trim() && !luoMessage.trim())}
                    title="Translate"
                  >
                    {isTranslating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Translating...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m5 8 6 6" />
                          <path d="m4 14 6-6 2-3" />
                          <path d="M2 5h12" />
                          <path d="M7 2h1" />
                          <path d="m22 22-5-10-5 10" />
                          <path d="M14 18h6" />
                        </svg>
                        <span>Translate</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Luo input */}
                <div className="flex-1">
                  <Textarea
                    ref={luoTextareaRef}
                    placeholder="Type in Luo..."
                    value={luoMessage}
                    onChange={handleLuoChange}
                    onKeyDown={(e) => handleKeyDown(e, false)}
                    onClick={() => !isToolbarVisible && setIsToolbarVisible(true)}
                    className={`w-full border-0 focus-visible:ring-0 resize-none bg-transparent outline-none
                      text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500
                      transition-all duration-200 ${isExpanded ? 'min-h-[120px]' : ''}`}
                    rows={isExpanded ? 4 : 1}
                  />
                </div>
              </div>

              {/* Character count, subtle hint */}
              <div className="flex justify-between mt-1">
                {englishMessage.length > 0 && (
                  <div className="text-xs text-left text-gray-400 mr-1 select-none">
                    {englishMessage.length} {englishMessage.length === 1 ? 'character' : 'characters'}
                  </div>
                )}
                {luoMessage.length > 0 && (
                  <div className="text-xs text-right text-gray-400 mr-1 select-none">
                    {luoMessage.length} {luoMessage.length === 1 ? 'character' : 'characters'}
                  </div>
                )}
              </div>

              {/* Translation status indicator */}
              <div className={`text-xs text-center mt-2 py-1 px-2 rounded-md select-none ${
                isTranslating
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              }`}>
                {isTranslating ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Translating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="m5 8 6 6" />
                      <path d="m4 14 6-6 2-3" />
                      <path d="M2 5h12" />
                      <path d="M7 2h1" />
                      <path d="m22 22-5-10-5 10" />
                      <path d="M14 18h6" />
                    </svg>
                    {englishMessage || luoMessage
                      ? "Click 'Translate' to translate your text"
                      : "Type in either language and click 'Translate'"}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom toolbar on mobile */}
            <div className="md:hidden flex items-center justify-between p-2 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-2xl">
              <div className="flex space-x-2">
                <FileUpload onUpload={handleFileUploaded}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="p-1 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </FileUpload>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDrawingPad(!showDrawingPad)}
                  className="p-1 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <PencilLine className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-xs text-gray-500">
                Press <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700">↵</kbd> to send
              </div>
            </div>
          </div>

          {/* Send Controls */}
          <div className="flex gap-2 ml-2">
            {!isRecording && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStartVoiceRecording}
                className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-200"
                title="Voice Input"
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={(!englishMessage.trim() && !luoMessage.trim()) || isSending}
              className={`flex items-center justify-center h-10 w-10 rounded-full text-white shadow-md hover:shadow-lg
                transition-all duration-200 ${isSending ? 'animate-pulse' : ''}
                ${(!englishMessage.trim() && !luoMessage.trim()) ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
              title="Send Message"
            >
              <Send className={`h-5 w-5 ${isSending ? 'opacity-50' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Offline Mode Warning */}
      {isOffline && (
        <div className="mt-3 max-w-4xl mx-auto">
          <div className="flex items-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800/60 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-yellow-500 mr-2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              <path d="M12 9v4"></path>
              <path d="M12 17h.01"></path>
            </svg>
            <span className="text-yellow-700 dark:text-yellow-400">
              You're in offline mode. Messages will be sent when you're back online.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
