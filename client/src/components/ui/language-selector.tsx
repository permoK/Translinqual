import { useState, useEffect } from "react";
import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Language } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { getLanguages } from "@/lib/api";

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (code: string) => void;
}

export function LanguageSelector({ selectedLanguage, onLanguageChange }: LanguageSelectorProps) {
  const { data: languages = [], isLoading } = useQuery({
    queryKey: ["/api/languages"],
    queryFn: getLanguages
  });

  // Find the selected language name
  const selectedLanguageName = languages.find(lang => lang.code === selectedLanguage)?.name || "Luo (Dholuo)";

  // Default to Luo if no language is selected
  useEffect(() => {
    if (languages.length > 0 && !selectedLanguage) {
      const luoLanguage = languages.find(lang => lang.code === "luo");
      if (luoLanguage) {
        onLanguageChange(luoLanguage.code);
      }
    }
  }, [languages, selectedLanguage, onLanguageChange]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-1">
          <Globe className="h-4 w-4 mr-2" />
          <span>{selectedLanguageName}</span>
          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {isLoading ? (
          <DropdownMenuItem disabled>Loading languages...</DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuLabel>Available Languages</DropdownMenuLabel>
            {languages.map((language) => (
              <DropdownMenuItem
                key={language.code}
                onClick={() => onLanguageChange(language.code)}
                className="flex items-center justify-between"
              >
                <span>{language.name}</span>
                {selectedLanguage === language.code && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
