import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ThemeSettings {
  theme_mode: "light" | "dark" | "system";
  color_scheme: "blue" | "purple" | "green" | "red" | "orange";
  font_family: "default" | "serif" | "mono";
  font_size: "small" | "medium" | "large";
}

interface ThemeContextType {
  theme: ThemeSettings;
  setTheme: (theme: Partial<ThemeSettings>) => Promise<void>;
  loading: boolean;
}

  const defaultTheme: ThemeSettings = {
  theme_mode: "dark",
  color_scheme: "blue",
  font_family: "default",
  font_size: "medium",
};

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  setTheme: async () => {},
  loading: true,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeSettings>(defaultTheme);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const loadTheme = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_themes")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setThemeState({
          theme_mode: data.theme_mode as any,
          color_scheme: data.color_scheme as any,
          font_family: data.font_family as any,
          font_size: data.font_size as any,
        });
      } else if (!error || error.code === "PGRST116") {
        // Create default theme if doesn't exist
        await supabase.from("user_themes").insert({
          user_id: user.id,
          ...defaultTheme,
        });
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    } finally {
      setLoading(false);
    }
  };

  const setTheme = async (newTheme: Partial<ThemeSettings>) => {
    try {
      const updatedTheme = { ...theme, ...newTheme };
      setThemeState(updatedTheme);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("user_themes")
        .upsert({
          user_id: user.id,
          ...updatedTheme,
        });
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const applyTheme = (themeSettings: ThemeSettings) => {
    const root = document.documentElement;

    // Apply dark/light mode
    let effectiveMode = themeSettings.theme_mode;
    if (effectiveMode === "system") {
      effectiveMode = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    if (effectiveMode === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }

    // Apply color scheme
    const colorSchemes = {
      blue: { primary: "221 83% 53%", primaryForeground: "210 40% 98%" },
      purple: { primary: "271 91% 65%", primaryForeground: "210 40% 98%" },
      green: { primary: "142 71% 45%", primaryForeground: "210 40% 98%" },
      red: { primary: "0 72% 51%", primaryForeground: "210 40% 98%" },
      orange: { primary: "25 95% 53%", primaryForeground: "210 40% 98%" },
    };

    const scheme = colorSchemes[themeSettings.color_scheme];
    root.style.setProperty("--primary", scheme.primary);
    root.style.setProperty("--primary-foreground", scheme.primaryForeground);

    // Apply font
    const fontFamilies = {
      default: "system-ui, -apple-system, sans-serif",
      serif: "Georgia, serif",
      mono: "'Courier New', monospace",
    };

    root.style.fontFamily = fontFamilies[themeSettings.font_family];

    // Apply font size
    const fontSizes = {
      small: "14px",
      medium: "16px",
      large: "18px",
    };

    root.style.fontSize = fontSizes[themeSettings.font_size];
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};
