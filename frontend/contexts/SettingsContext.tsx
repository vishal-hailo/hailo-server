import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_URL } from '../constants/Config';



export interface NotificationSettings {
    surgeAlerts: boolean;
    priceDrops: boolean;
    rideReminders: boolean;
    promotions: boolean;
    weeklyReports: boolean;
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
}

export interface Settings {
    notifications: NotificationSettings;
    shareLocation: boolean;
    shareRideHistory: boolean;
    personalizedAds: boolean;
    analyticsSharing: boolean;
    language: string;
    theme: 'system' | 'light' | 'dark';
}

const DEFAULT_SETTINGS: Settings = {
    notifications: {
        surgeAlerts: true,
        priceDrops: true,
        rideReminders: true,
        promotions: false,
        weeklyReports: true,
        pushNotifications: true,
        emailNotifications: false,
        smsNotifications: false,
    },
    shareLocation: true,
    shareRideHistory: false,
    personalizedAds: false,
    analyticsSharing: true,
    language: 'en',
    theme: 'system',
};

interface SettingsContextType {
    settings: Settings;
    loading: boolean;
    updateSetting: (key: keyof Settings, value: any) => Promise<void>;
    resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const { userProfile, initialized } = useAuth();
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    // Load settings from user profile when it changes
    useEffect(() => {
        if (initialized) {
            if (userProfile?.settings) {
                // Merge with defaults to ensure all keys exist
                setSettings({ ...DEFAULT_SETTINGS, ...userProfile.settings });
            }
            setLoading(false);
        }
    }, [userProfile, initialized]);

    const updateSetting = async (key: keyof Settings, value: any) => {
        try {
            // Optimistic update
            let newSettings = { ...settings };

            if (key === 'notifications' && typeof value === 'object') {
                newSettings.notifications = { ...newSettings.notifications, ...value };
            } else {
                newSettings = { ...newSettings, [key]: value };
            }

            setSettings(newSettings);

            const token = await AsyncStorage.getItem('authToken');
            if (token) {
                let payload = {};
                if (key === 'notifications') {
                    // Send the full notifications object to be safe
                    payload = { settings: { notifications: newSettings.notifications } };
                } else {
                    payload = { settings: { [key]: value } };
                }

                await axios.post(
                    `${API_URL}/api/v1/me/update`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
        } catch (error) {
            console.error('Failed to update setting:', error);
            // Revert on error (optional, skipping for simplicity)
        }
    };

    const resetSettings = async () => {
        setSettings(DEFAULT_SETTINGS);
        // Sync reset to backend if needed
    };

    return (
        <SettingsContext.Provider value={{ settings, loading, updateSetting, resetSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
