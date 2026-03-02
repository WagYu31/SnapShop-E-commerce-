import React, { createContext, useContext, useState, useCallback } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    isDark: boolean;
    toggleTheme: () => void;
    colors: typeof lightColors;
}

const lightColors = {
    background: '#F8F8F8',
    surface: '#FFFFFF',
    primary: '#1A1A2E',
    accent: '#6C5CE7',
    primaryText: '#1A1A2E',
    secondaryText: '#666666',
    gray: '#999999',
    border: '#EEEEEE',
    lightGray: '#F5F5F5',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    inputBg: '#F0F0F0',
    chipBg: '#F0F0F3',
    chipActiveBg: '#1A1A2E',
    chipActiveText: '#FFFFFF',
    chipText: '#444444',
    statusBar: 'dark' as 'dark' | 'light',
};

const darkColors: typeof lightColors = {
    background: '#121212',
    surface: '#1C1C1E',
    primary: '#FFFFFF',
    accent: '#A78BFA',
    primaryText: '#F2F2F7',
    secondaryText: '#8E8E93',
    gray: '#636366',
    border: '#38383A',
    lightGray: '#2C2C2E',
    card: '#1C1C1E',
    cardElevated: '#2C2C2E',
    inputBg: '#2C2C2E',
    chipBg: '#2C2C2E',
    chipActiveBg: '#A78BFA',
    chipActiveText: '#FFFFFF',
    chipText: '#AEAEB2',
    statusBar: 'light',
};

const ThemeContext = createContext<ThemeContextType>({
    mode: 'light',
    isDark: false,
    toggleTheme: () => { },
    colors: lightColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>('light');

    const toggleTheme = useCallback(() => {
        setMode(prev => (prev === 'light' ? 'dark' : 'light'));
    }, []);

    const isDark = mode === 'dark';
    const colors = isDark ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ mode, isDark, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
export { lightColors, darkColors };
