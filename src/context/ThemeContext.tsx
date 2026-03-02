import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: (value: boolean) => void;
  isLoadingTheme: boolean; 
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem("theme");
        if (saved !== null) {
          setIsDark(saved === "true");
        }
      } catch (error) {
        console.error("❌ Error cargando el tema:", error);
      } finally {
        setIsLoadingTheme(false);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = useCallback(async (value: boolean) => {
    setIsDark(value);
    try {
      await AsyncStorage.setItem("theme", String(value));
    } catch (error) {
      console.error("❌ Error guardando el tema:", error);
    }
  }, []);

  const themeValue = useMemo(() => ({
    isDark,
    toggleTheme,
    isLoadingTheme
  }), [isDark, toggleTheme, isLoadingTheme]);

  if (isLoadingTheme) return null;

  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe ser usado dentro de un ThemeProvider");
  }
  return context;
};