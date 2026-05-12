import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme, Animated, View, StyleSheet } from 'react-native';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  weights: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  sizes: {
    caption: 13,
    xs: 15,
    sm: 17,
    base: 15,
    lg: 21,
    xl: 23,
    '2xl': 27,
    '3xl': 33,
    '4xl': 39,
    '5xl': 51,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

const spacing = {
  micro: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 14,
  '2xl': 16,
  '3xl': 20,
  full: 9999,
};

const lightTheme = {
  mode: 'light',
  colors: {
    primary: '#0F766E',
    primaryDark: '#115E59',
    primaryLight: '#14B8A6',
    primaryMuted: '#99F6E4',

    secondary: '#6B8E23',
    secondaryDark: '#4D6B16',
    secondaryLight: '#8EAA52',
    secondaryMuted: '#DDE8C5',

    accent: '#D97706',
    accentHover: '#B45309',

    gradientStart: '#0F766E',
    gradientMid: '#1F8A70',
    gradientEnd: '#D97706',

    heroGradientStart: '#0B1F33',
    heroGradientMid: '#12324A',
    heroGradientEnd: '#0F766E',

    buttonGradientStart: '#0F766E',
    buttonGradientEnd: '#1F8A70',

    background: '#F7F4EC',
    backgroundSecondary: '#EFE8DA',
    backgroundTertiary: '#E4D8C3',
    surface: '#FFFDFC',

    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    cardBackground: '#FFFFFF',
    cardGlass: 'rgba(255, 253, 252, 0.78)',
    cardBorder: '#D7CCB8',
    cardBorderHover: '#1F8A70',

    text: '#13212E',
    textPrimary: '#13212E',
    textSecondary: '#52606D',
    textTertiary: '#7B8794',
    textMuted: '#B8C2CC',
    textInverse: '#FFFFFF',
    textOnPrimary: '#FFFFFF',

    border: '#D7CCB8',
    borderLight: '#ECE4D7',
    borderFocus: '#0F766E',
    divider: '#E6DDCF',

    link: '#0F766E',
    linkHover: '#115E59',
    placeholder: '#8A94A6',
    disabled: '#D6D3D1',
    disabledText: '#9CA3AF',

    success: '#2F855A',
    successLight: '#D9F2E3',
    successDark: '#276749',
    error: '#C2410C',
    errorLight: '#FDE7DE',
    errorDark: '#9A3412',
    warning: '#CA8A04',
    warningLight: '#FEF3C7',
    warningDark: '#A16207',
    info: '#0E7490',
    infoLight: '#D7EEF5',
    infoDark: '#155E75',

    shadow: 'rgba(11, 31, 51, 0.10)',
    shadowMedium: 'rgba(11, 31, 51, 0.15)',
    shadowStrong: 'rgba(11, 31, 51, 0.22)',
    shadowPrimary: 'rgba(15, 118, 110, 0.24)',

    overlay: 'rgba(19, 33, 46, 0.52)',
    overlayLight: 'rgba(19, 33, 46, 0.28)',

    primaryGlow: 'rgba(15, 118, 110, 0.18)',
    secondaryGlow: 'rgba(107, 142, 35, 0.18)',
    successGlow: 'rgba(47, 133, 90, 0.16)',
    errorGlow: 'rgba(194, 65, 12, 0.16)',

    inputBackground: '#FFFDFC',
    inputBorder: '#D7CCB8',
    inputBorderFocus: '#0F766E',
    inputText: '#13212E',
    inputPlaceholder: '#8A94A6',

    navbarBackground: 'linear-gradient(135deg, #0B1F33 0%, #0F766E 100%)',
    navbarText: '#FFFFFF',
    navbarTextHover: 'rgba(255, 247, 237, 0.84)',

    sidebarGradientTop: '#0B1F33',
    sidebarGradientBottom: '#0F766E',

    tabBarBackground: '#FFFFFF',
    tabBarActiveTint: '#0F766E',
    tabBarInactiveTint: '#8A94A6',
    tabBarBorder: '#E6DDCF',
  },

  glass: {
    background: 'rgba(255, 253, 252, 0.78)',
    backdropBlur: 12,
    border: 'rgba(215, 204, 184, 0.55)',
    borderHover: 'rgba(15, 118, 110, 0.24)',
  },

  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 30,
      elevation: 8,
    },
    glow: {
      shadowColor: '#0F766E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
  },

  borderRadius,
  spacing,
  typography,

  animation: {
    fast: 150,
    normal: 250,
    slow: 300,
  },

  layout: {
    headerHeight: 64,
    headerHeightMobile: 56,
    sidebarWidth: 260,
    sidebarTriggerZone: 12,
    maxContentWidth: 1440,
    gutter: 24,
    margin: 32,
  },
};

const darkTheme = {
  mode: 'dark',
  colors: {
    primary: '#2DD4BF',
    primaryDark: '#14B8A6',
    primaryLight: '#5EEAD4',
    primaryMuted: '#0F766E',

    secondary: '#A3BE5C',
    secondaryDark: '#6B8E23',
    secondaryLight: '#C7D98B',
    secondaryMuted: '#4D6B16',

    accent: '#F59E0B',
    accentHover: '#D97706',

    gradientStart: '#12324A',
    gradientMid: '#0F766E',
    gradientEnd: '#F59E0B',

    heroGradientStart: '#071521',
    heroGradientMid: '#0B1F33',
    heroGradientEnd: '#12324A',

    buttonGradientStart: '#0F766E',
    buttonGradientEnd: '#2DD4BF',

    background: '#071521',
    backgroundSecondary: '#0B1F33',
    backgroundTertiary: '#12324A',
    surface: '#0B1F33',

    card: '#0B1F33',
    cardElevated: '#12324A',
    cardBackground: '#0B1F33',
    cardGlass: 'rgba(11, 31, 51, 0.84)',
    cardBorder: 'rgba(167, 139, 95, 0.22)',
    cardBorderHover: '#2DD4BF',

    text: '#F7F4EC',
    textPrimary: '#F7F4EC',
    textSecondary: '#C8D2DC',
    textTertiary: '#8FA4B8',
    textMuted: '#5D7388',
    textInverse: '#071521',
    textOnPrimary: '#FFFFFF',

    border: 'rgba(167, 139, 95, 0.24)',
    borderLight: 'rgba(255,255,255,0.06)',
    borderFocus: '#2DD4BF',
    divider: 'rgba(167, 139, 95, 0.18)',

    link: '#5EEAD4',
    linkHover: '#99F6E4',
    placeholder: '#7B93A8',
    disabled: '#374151',
    disabledText: '#6B7280',

    success: '#4ADE80',
    successLight: 'rgba(74, 222, 128, 0.16)',
    successDark: '#22C55E',
    error: '#FB923C',
    errorLight: 'rgba(251, 146, 60, 0.16)',
    errorDark: '#EA580C',
    warning: '#FACC15',
    warningLight: 'rgba(250, 204, 21, 0.16)',
    warningDark: '#EAB308',
    info: '#67E8F9',
    infoLight: 'rgba(103, 232, 249, 0.16)',
    infoDark: '#22D3EE',

    shadow: 'rgba(0,0,0,0.5)',
    shadowMedium: 'rgba(0,0,0,0.6)',
    shadowStrong: 'rgba(0,0,0,0.7)',
    shadowPrimary: 'rgba(45, 212, 191, 0.32)',

    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',

    tabBarBackground: '#0B1F33',
    tabBarActiveTint: '#2DD4BF',
    tabBarInactiveTint: 'rgba(247,244,236,0.45)',
    tabBarBorder: 'rgba(167, 139, 95, 0.18)',

    primaryGlow: 'rgba(45, 212, 191, 0.28)',
    secondaryGlow: 'rgba(163, 190, 92, 0.24)',
    successGlow: 'rgba(74, 222, 128, 0.24)',
    errorGlow: 'rgba(251, 146, 60, 0.24)',

    inputBackground: '#12324A',
    inputBorder: 'rgba(167, 139, 95, 0.24)',
    inputBorderFocus: '#2DD4BF',
    inputText: '#F7F4EC',
    inputPlaceholder: '#7B93A8',

    navbarBackground: 'linear-gradient(135deg, #071521 0%, #12324A 100%)',
    navbarText: '#F7F4EC',
    navbarTextHover: 'rgba(247, 244, 236, 0.82)',

    sidebarGradientTop: '#071521',
    sidebarGradientBottom: '#12324A',
  },

  glass: {
    background: 'rgba(11, 31, 51, 0.84)',
    backdropBlur: 16,
    border: 'rgba(167, 139, 95, 0.18)',
    borderHover: 'rgba(45, 212, 191, 0.34)',
  },

  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 30,
      elevation: 8,
    },
    glow: {
      shadowColor: '#2DD4BF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 8,
    },
    glowPurple: {
      shadowColor: '#A3BE5C',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 8,
    },
  },

  borderRadius,
  spacing,
  typography,

  animation: {
    fast: 150,
    normal: 250,
    slow: 300,
  },

  layout: {
    headerHeight: 64,
    headerHeightMobile: 56,
    sidebarWidth: 260,
    sidebarTriggerZone: 12,
    maxContentWidth: 1440,
    gutter: 24,
    margin: 32,
  },
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  const transitionAnim = useRef(new Animated.Value(0)).current;
  const [overlayColor, setOverlayColor] = useState('#F7F4EC');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme) {
        setThemeMode(savedTheme);
      } else {
        setThemeMode(systemColorScheme || 'light');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      setThemeMode('light');
    } finally {
      setIsLoading(false);
    }
  };

  const animateThemeSwitch = (newMode) => {
    const bgColor = newMode === 'dark' ? '#071521' : '#F7F4EC';
    setOverlayColor(bgColor);

    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setThemeMode(newMode);
      AsyncStorage.setItem('themeMode', newMode).catch(() => {});

      Animated.timing(transitionAnim, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }).start();
    });
  };

  const toggleTheme = () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    animateThemeSwitch(newTheme);
  };

  const setTheme = (mode) => {
    if (mode !== themeMode) {
      animateThemeSwitch(mode);
    }
  };

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  const value = {
    theme,
    themeMode,
    toggleTheme,
    setTheme,
    isLoading,
    isDark: themeMode === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      <View style={themeProviderStyles.root}>
        {children}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: overlayColor, opacity: transitionAnim },
          ]}
        />
      </View>
    </ThemeContext.Provider>
  );
};

const themeProviderStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
