import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    withSpring,
    Easing,
    runOnJS,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const PHONE_WIDTH = width * 0.5;
const PHONE_HEIGHT = PHONE_WIDTH * 2;

interface SplashAnimationProps {
    onAnimationComplete?: () => void;
}

export default function SplashAnimation({ onAnimationComplete }: SplashAnimationProps) {
    // Animation values
    const carPosition = useSharedValue(-50);
    const graphHeight1 = useSharedValue(0);
    const graphHeight2 = useSharedValue(0);
    const graphHeight3 = useSharedValue(0);
    const phoneScale = useSharedValue(0.8);
    const phoneOpacity = useSharedValue(0);

    useEffect(() => {
        // 1. Fade in phone
        phoneOpacity.value = withTiming(1, { duration: 500 });
        phoneScale.value = withSpring(1);

        // 2. Move car across
        carPosition.value = withDelay(
            500,
            withTiming(PHONE_WIDTH + 50, { duration: 1500, easing: Easing.inOut(Easing.quad) })
        );

        // 3. Show graph bars sequentially
        graphHeight1.value = withDelay(1000, withSpring(40));
        graphHeight2.value = withDelay(1200, withSpring(70));
        graphHeight3.value = withDelay(1400, withSpring(50));

        // 4. Complete
        if (onAnimationComplete) {
            setTimeout(onAnimationComplete, 3000);
        }
    }, []);

    const phoneStyle = useAnimatedStyle(() => ({
        opacity: phoneOpacity.value,
        transform: [{ scale: phoneScale.value }],
    }));

    const carStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: carPosition.value }],
    }));

    const bar1Style = useAnimatedStyle(() => ({ height: graphHeight1.value }));
    const bar2Style = useAnimatedStyle(() => ({ height: graphHeight2.value }));
    const bar3Style = useAnimatedStyle(() => ({ height: graphHeight3.value }));

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.phoneFrame, phoneStyle]}>
                {/* Screen Content */}
                <View style={styles.screen}>
                    {/* Road */}
                    <View style={styles.road} />

                    {/* Car */}
                    <Animated.View style={[styles.car, carStyle]}>
                        <View style={styles.carBody} />
                        <View style={styles.carTop} />
                        <View style={styles.wheelLeft} />
                        <View style={styles.wheelRight} />
                    </Animated.View>

                    {/* Graph */}
                    <View style={styles.graphContainer}>
                        <Animated.View style={[styles.bar, bar1Style]} />
                        <Animated.View style={[styles.bar, bar2Style]} />
                        <Animated.View style={[styles.bar, bar3Style]} />
                    </View>
                </View>

                {/* Home Button */}
                <View style={styles.homeButton} />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FF6B35', // HailO Orange
    },
    phoneFrame: {
        width: PHONE_WIDTH,
        height: PHONE_HEIGHT,
        backgroundColor: '#1F2937',
        borderRadius: 24,
        padding: 12,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#374151',
    },
    screen: {
        width: '100%',
        height: '85%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center',
    },
    homeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#4B5563',
    },
    road: {
        position: 'absolute',
        bottom: 60,
        width: '100%',
        height: 2,
        backgroundColor: '#E5E7EB',
    },
    car: {
        position: 'absolute',
        bottom: 62,
        left: 0,
        width: 40,
        height: 20,
    },
    carBody: {
        position: 'absolute',
        bottom: 4,
        width: 40,
        height: 12,
        backgroundColor: '#FF6B35',
        borderRadius: 4,
    },
    carTop: {
        position: 'absolute',
        bottom: 16,
        left: 8,
        width: 24,
        height: 8,
        backgroundColor: '#FF6B35',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    wheelLeft: {
        position: 'absolute',
        bottom: 0,
        left: 6,
        width: 8,
        height: 8,
        backgroundColor: '#1F2937',
        borderRadius: 4,
    },
    wheelRight: {
        position: 'absolute',
        bottom: 0,
        right: 6,
        width: 8,
        height: 8,
        backgroundColor: '#1F2937',
        borderRadius: 4,
    },
    graphContainer: {
        position: 'absolute',
        top: 40,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        height: 80,
        gap: 8,
    },
    bar: {
        width: 16,
        backgroundColor: '#10B981', // Green for savings/stats
        borderRadius: 4,
    },
});
