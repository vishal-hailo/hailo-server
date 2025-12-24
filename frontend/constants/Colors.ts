/**
 * HailO Design System - Colors
 * Updated for new blue theme design
 */

export const Colors = {
  // Primary Brand Colors
  primary: {
    main: '#3B82F6',      // Vibrant Blue
    light: '#60A5FA',     // Light Blue
    dark: '#2563EB',      // Dark Blue
    subtle: '#DBEAFE',    // Very Light Blue for backgrounds
  },

  // Secondary Colors
  secondary: {
    teal: '#10B981',      // Teal/Green for success, no surge
    orange: '#F97316',    // Orange for surge warnings
    peach: '#FED7AA',     // Light orange for mild surge
    yellow: '#FCD34D',    // Yellow for alerts
    purple: '#8B5CF6',    // Purple for accents
  },

  // Neutral Grays
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Semantic Colors
  success: '#10B981',     // Green
  warning: '#F59E0B',     // Amber
  error: '#EF4444',       // Red
  info: '#3B82F6',        // Blue

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    card: '#FFFFFF',
    modal: 'rgba(0, 0, 0, 0.5)',
  },

  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    link: '#3B82F6',
  },

  // Border Colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },

  // Surge Indicator Colors
  surge: {
    none: '#10B981',      // Teal - No surge
    low: '#FED7AA',       // Light peach - Low surge (1.1-1.2x)
    medium: '#F97316',    // Orange - Medium surge (1.3-1.5x)
    high: '#DC2626',      // Red - High surge (1.6x+)
  },

  // Status Colors
  status: {
    confirmed: '#10B981',
    pending: '#F59E0B',
    cancelled: '#EF4444',
    inProgress: '#3B82F6',
  },
};

export default Colors;
