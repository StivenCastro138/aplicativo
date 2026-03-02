import React, { createContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import translations from "./translations.json";

interface LanguageContextProps {
  language: "es" | "en";
  setLanguage: (lang: "es" | "en") => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<"es" | "en">("es");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const stored = await AsyncStorage.getItem("language");
        if (stored === "es" || stored === "en") {
          setLanguageState(stored);
        }
      } catch (error) {
        console.error("❌ Error loading language:", error);
      } finally {
        setIsReady(true);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (lang: "es" | "en") => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem("language", lang);
    } catch (error) {
      console.error("❌ Error saving language:", error);
    }
  }, []);

  const t = useCallback((key: string): string => {
    if (!key) return "";

    const keys = key.split('.');
    
    let result: any = (translations as Record<string, any>)[language];

    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return key; 
      }
    }

    return typeof result === 'string' ? result : key;
  }, [language]);

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language, setLanguage, t]);

  if (!isReady) return null;

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};