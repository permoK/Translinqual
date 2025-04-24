import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { requestTranslation } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";
import { Translate, Send } from "lucide-react";

interface DholuoInputProps {
  onTranslationComplete: (originalText: string, translatedText: string) => void;
}

export function DholuoInput({ onTranslationComplete }: DholuoInputProps) {
  const [dholuoText, setDholuoText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleTranslate = () => {
    if (!dholuoText.trim() || isTranslating) return;

    setIsTranslating(true);

    // Add a listener for translation results
    const handleTranslationEvent = (event: MessageEvent) => {
      if (event.data &&
          event.data.type === "translation" &&
          event.data.sourceLanguage === "Dholuo" &&
          event.data.targetLanguage === "English") {

        onTranslationComplete(event.data.originalText, event.data.translatedText);
        setDholuoText("");
        setIsTranslating(false);

        // Remove the listener
        window.removeEventListener("message", handleTranslationEvent);
      }
    };

    window.addEventListener("message", handleTranslationEvent);

    // Request translation
    requestTranslation(dholuoText, "Dholuo", "English");

    // Set a timeout to handle cases where translation fails
    setTimeout(() => {
      if (isTranslating) {
        setIsTranslating(false);
        window.removeEventListener("message", handleTranslationEvent);
        toast({
          title: "Translation timed out",
          description: "Please try again later",
          variant: "destructive"
        });
      }
    }, 10000); // 10 seconds timeout
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Translate on Ctrl+Enter
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  return (
    <div className="border dark:border-gray-700 rounded-lg p-3 bg-orange-50 dark:bg-orange-900/20 mb-4">
      <div className="flex items-center mb-2">
        <Translate className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
        <h3 className="text-sm font-medium text-orange-800 dark:text-orange-300">Dholuo Input</h3>
      </div>

      <div className="flex space-x-2">
        <Textarea
          ref={textareaRef}
          placeholder="Type in Dholuo here..."
          value={dholuoText}
          onChange={(e) => setDholuoText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[60px] border-orange-200 dark:border-orange-800 focus-visible:ring-orange-400"
        />

        <Button
          onClick={handleTranslate}
          disabled={!dholuoText.trim() || isTranslating}
          className="bg-orange-600 hover:bg-orange-700 text-white self-end"
        >
          {isTranslating ? (
            <>
              <span className="animate-pulse">Translating...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Translate
            </>
          )}
        </Button>
      </div>

      <div className="text-xs text-orange-600 dark:text-orange-400 mt-2">
        Press <kbd className="px-1 py-0.5 rounded bg-orange-100 dark:bg-orange-800">Ctrl+Enter</kbd> to translate
      </div>
    </div>
  );
}
