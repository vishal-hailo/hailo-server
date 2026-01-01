/**
 * HailO Design System - Colors
 * Modern, Professional, Techy Theme
 * Based on oklch color space converted to hex
 */

export const Colors = {
  // Primary Brand Colors - Deep Indigo/Blue (professional and techy)
  primary: {
    main: '#4338CA',      // Primary - Deep indigo (oklch 0.45 0.28 265)
    light: '#6366F1',     // Lighter indigo
    dark: '#3730A3',      // Darker indigo
    subtle: '#EEF2FF',    // Very light indigo for backgrounds
    muted: '#E0E7FF',     // Muted indigo
  },

  // Secondary Colors
  secondary: {
    teal: '#14B8A6',      // Success - Teal (oklch 0.62 0.18 165)
    orange: '#F59E0B',    // Accent - Amber/Orange for surge (oklch 0.72 0.18 50)
    peach: '#FED7AA',     // Light orange for mild surge
    yellow: '#FCD34D',    // Yellow for alerts
    purple: '#8B5CF6',    // Purple for accents
  },

  // Neutral Grays with subtle indigo undertone
  neutral: {
    50: '#F8FAFC',        // Background tint
    100: '#F1F5F9',       // Secondary background
    200: '#E2E8F0',       // Border light
    300: '#CBD5E1',       // Border medium
    400: '#94A3B8',       // Muted foreground
    500: '#64748B',       // Secondary text
    600: '#475569',       // Primary text muted
    700: '#334155',       // Primary text
    800: '#1E293B',       // Foreground
    900: '#0F172A',       // Dark foreground
  },

  // Semantic Colors
  success: '#14B8A6',     // Teal (oklch 0.62 0.18 165)
  warning: '#F59E0B',     // Amber (oklch 0.72 0.18 50)
  error: '#DC2626',       // Destructive red (oklch 0.55 0.22 25)
  info: '#4338CA',        // Primary indigo

  // Background Colors with subtle indigo tint
  background: {
    primary: '#FAFAFF',   // Subtle indigo-tinted cool tone
    secondary: '#F5F5FF', // Slightly more tinted
    tertiary: '#EEF2FF',  // Light indigo
    card: '#FFFFFF',      // Pure white for cards
    cardTinted: '#FAFAFF', // Card with subtle tint
    modal: 'rgba(15, 23, 42, 0.6)', // Dark modal overlay
  },

  // Text Colors
  text: {
    primary: '#0F172A',   // Dark foreground (oklch 0.12 0.02 260)
    secondary: '#64748B', // Muted foreground
    tertiary: '#94A3B8',  // More muted
    inverse: '#FFFFFF',   // White text
    link: '#4338CA',      // Primary for links
    accent: '#F59E0B',    // Orange accent text
  },

  // Border Colors with indigo tint
  border: {
    light: '#E2E8F0',     // Light border
    medium: '#CBD5E1',    // Medium border
    dark: '#94A3B8',      // Dark border
    primary: '#C7D2FE',   // Primary tinted border
  },

  // Surge Indicator Colors
  surge: {
    none: '#14B8A6',      // Teal - No surge
    low: '#FED7AA',       // Light peach - Low surge (1.1-1.2x)
    medium: '#F59E0B',    // Amber - Medium surge (1.3-1.5x)
    high: '#DC2626',      // Red - High surge (1.6x+)
  },

  // Status Colors
  status: {
    confirmed: '#14B8A6', // Teal success
    pending: '#F59E0B',   // Amber pending
    cancelled: '#DC2626', // Red cancelled
    inProgress: '#4338CA', // Primary in progress
  },

  // Chart Colors
  chart: {
    1: '#4338CA',         // Primary indigo
    2: '#F59E0B',         // Amber
    3: '#14B8A6',         // Teal
    4: '#0EA5E9',         // Sky blue
    5: '#EC4899',         // Pink
  },

  // Gradient colors for backgrounds
  gradient: {
    start: '#EEF2FF',     // Light indigo
    middle: '#F5F3FF',    // Light purple
    end: '#FDF4FF',       // Light pink
  },
};

export default Colors;
