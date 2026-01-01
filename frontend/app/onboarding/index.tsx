import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Animated,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Custom Icon Components
const MoneyIcon = () => (
  <View style={styles.iconContainer}>
    <View style={styles.iconBackground}>
      <Svg width="40" height="40" viewBox="0 0 40 40">
        <Rect x="4" y="10" width="32" height="20" rx="3" stroke="#F97316" strokeWidth="2.5" fill="none" />
        <Circle cx="20" cy="20" r="6" stroke="#F97316" strokeWidth="2.5" fill="none" />
        <Circle cx="10" cy="20" r="2" fill="#F97316" />
        <Circle cx="30" cy="20" r="2" fill="#F97316" />
      </Svg>
    </View>
  </View>
);

const BrainIcon = () => (
  <View style={styles.iconContainer}>
    <View style={[styles.iconBackground, { backgroundColor: '#FEF3E2' }]}>
      <Svg width="40" height="40" viewBox="0 0 40 40">
        <G stroke="#92400E" strokeWidth="2.5" fill="none">
          {/* Left brain half */}
          <Path d="M12 28 C6 28, 6 20, 10 16 C6 14, 8 8, 14 8 C14 4, 22 4, 20 10" />
          {/* Right brain half */}
          <Path d="M28 28 C34 28, 34 20, 30 16 C34 14, 32 8, 26 8 C26 4, 18 4, 20 10" />
          {/* Center line */}
          <Path d="M20 10 L20 32" />
          {/* Brain stem */}
          <Path d="M17 32 L23 32" />
        </G>
      </Svg>
    </View>
  </View>
);

const LightningIcon = () => (
  <View style={styles.iconContainer}>
    <View style={[styles.iconBackground, { backgroundColor: '#D1FAE5' }]}>
      <Svg width="40" height="40" viewBox="0 0 40 40">
        <Path 
          d="M22 6 L12 22 L18 22 L16 34 L28 16 L21 16 L24 6 Z" 
          stroke="#059669" 
          strokeWidth="2.5" 
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  </View>
);

const ONBOARDING_DATA = [
  {
    title: 'Save ₹500+/month',
    subtitle: 'on Mumbai commutes',
    description: 'Smart timing beats surge pricing every time',
    IconComponent: MoneyIcon,
  },
  {
    title: 'HailO Brain AI',
    subtitle: '',
    description: 'Smart recommendations that analyze weather, traffic, and history to find your cheapest ride.',
    IconComponent: BrainIcon,
  },
  {
    title: '1-Click Travel',
    subtitle: '',
    description: 'Save your frequent routes and book the best available ride with a single tap.',
    IconComponent: LightningIcon,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (nextIndex: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(() => setCurrentIndex(nextIndex), 150);
  };

  const handleNext = async () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      animateTransition(currentIndex + 1);
    } else {
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      router.replace('/auth/phone');
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboardingCompleted', 'true');
    router.replace('/auth/phone');
  };

  const current = ONBOARDING_DATA[currentIndex];
  const isLastScreen = currentIndex === ONBOARDING_DATA.length - 1;

  return (
    <View style={styles.container}>
      {/* Background gradient blobs */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#EEF2FF', '#F5F3FF', '#FDF4FF']}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[styles.blob, styles.blobTop]} />
        <View style={[styles.blob, styles.blobBottom]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Icon */}
          <current.IconComponent />

          {/* Title */}
          <Text style={[
            styles.title,
            currentIndex === 0 && styles.titleOrange
          ]}>
            {current.title}
          </Text>

          {/* Subtitle (if exists) */}
          {current.subtitle ? (
            <Text style={styles.subtitle}>{current.subtitle}</Text>
          ) : null}

          {/* Description */}
          <Text style={styles.description}>{current.description}</Text>

          {/* Pagination Dots */}
          <View style={styles.dotsContainer}>
            {ONBOARDING_DATA.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Next/Get Started Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {isLastScreen ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          </TouchableOpacity>

          {/* Skip Link (only show on non-last screens) */}
          {!isLastScreen && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Skip onboarding</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.4,
  },
  blobTop: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: '#E0E7FF',
    top: -width * 0.3,
    left: -width * 0.2,
  },
  blobBottom: {
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: '#D1FAE5',
    bottom: height * 0.15,
    right: -width * 0.2,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconBackground: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  titleOrange: {
    color: '#F97316',
  },
  subtitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    width: 28,
    backgroundColor: '#3B5BDB',
    borderRadius: 4,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 32,
  },
  primaryButton: {
    backgroundColor: '#3B5BDB',
    borderRadius: 50,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B5BDB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});
