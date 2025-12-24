import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Colors from '@/constants/Colors';

interface PillBadgeProps {
  label: string;
  variant?: 'surge-none' | 'surge-low' | 'surge-medium' | 'surge-high' | 'primary' | 'success' | 'warning';
  icon?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Pill-shaped badge component for surge indicators, status tags, etc.
 * Used in Surge Radar and various location cards
 */
export const PillBadge: React.FC<PillBadgeProps> = ({
  label,
  variant = 'primary',
  icon,
  style,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'surge-none':
        return { backgroundColor: Colors.surge.none, color: Colors.text.inverse };
      case 'surge-low':
        return { backgroundColor: Colors.surge.low, color: Colors.text.primary };
      case 'surge-medium':
        return { backgroundColor: Colors.surge.medium, color: Colors.text.inverse };
      case 'surge-high':
        return { backgroundColor: Colors.surge.high, color: Colors.text.inverse };
      case 'success':
        return { backgroundColor: Colors.success, color: Colors.text.inverse };
      case 'warning':
        return { backgroundColor: Colors.warning, color: Colors.text.inverse };
      default:
        return { backgroundColor: Colors.primary.main, color: Colors.text.inverse };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[styles.pill, { backgroundColor: variantStyles.backgroundColor }, style]}>
      {icon}
      <Text style={[styles.pillText, { color: variantStyles.color }]}>{label}</Text>
    </View>
  );
};

interface RoundIconProps {
  icon: React.ReactNode;
  backgroundColor?: string;
  size?: number;
}

/**
 * Circular icon container
 * Used for location indicators, ride type icons, etc.
 */
export const RoundIcon: React.FC<RoundIconProps> = ({
  icon,
  backgroundColor = Colors.primary.subtle,
  size = 48,
}) => {
  return (
    <View style={[styles.roundIcon, { backgroundColor, width: size, height: size, borderRadius: size / 2 }]}>
      {icon}
    </View>
  );
};

interface DayS

electorProps {
  days: boolean[];  // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  onDayPress?: (index: number) => void;
  disabled?: boolean;
}

/**
 * Day selector component for recurring rides
 * Shows M T W T F S S with blue for selected, grey for unselected
 */
export const DaySelector: React.FC<DaySelectorProps> = ({
  days,
  onDayPress,
  disabled = false,
}) => {
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <View style={styles.daySelector}>
      {dayLabels.map((label, index) => (
        <View
          key={index}
          style={[
            styles.dayButton,
            days[index] ? styles.dayButtonActive : styles.dayButtonInactive,
            disabled && styles.dayButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.dayButtonText,
              days[index] ? styles.dayButtonTextActive : styles.dayButtonTextInactive,
            ]}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
};

interface RouteIndicatorProps {
  from: string;
  to: string;
  fromColor?: string;
  toColor?: string;
}

/**
 * Route indicator showing origin → destination with colored dots
 */
export const RouteIndicator: React.FC<RouteIndicatorProps> = ({
  from,
  to,
  fromColor = Colors.primary.main,
  toColor = Colors.secondary.teal,
}) => {
  return (
    <View style={styles.routeContainer}>
      <View style={styles.routeItem}>
        <View style={[styles.routeDot, { backgroundColor: fromColor }]} />
        <Text style={styles.routeText}>{from}</Text>
      </View>
      <View style={styles.routeItem}>
        <View style={[styles.routeDot, { backgroundColor: toColor }]} />
        <Text style={styles.routeText}>{to}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Pill Badge Styles
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Round Icon Styles
  roundIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Day Selector Styles
  daySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: Colors.primary.main,
  },
  dayButtonInactive: {
    backgroundColor: Colors.neutral[200],
  },
  dayButtonDisabled: {
    opacity: 0.5,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: Colors.text.inverse,
  },
  dayButtonTextInactive: {
    color: Colors.text.secondary,
  },

  // Route Indicator Styles
  routeContainer: {
    gap: 8,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeText: {
    fontSize: 14,
    color: Colors.text.primary,
  },
});
