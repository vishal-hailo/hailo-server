import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();
  const [dailyNudge, setDailyNudge] = useState(true);
  const [surgeAlerts, setSurgeAlerts] = useState(true);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all app data
              await AsyncStorage.multiRemove([
                'authToken',
                'user',
                'locationsSetup',
                'onboardingCompleted'
              ]);
              // Navigate to auth
              router.replace('/auth/phone');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Success', 'Your account has been deleted.');
            router.replace('/auth/phone');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Settings</Text>

        {/* Saved Locations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Saved Locations</Text>
          
          <TouchableOpacity style={styles.item}>
            <View style={styles.itemLeft}>
              <Ionicons name="home" size={24} color="#FF6B35" />
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>Home</Text>
                <Text style={styles.itemSubtitle}>Andheri East</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.item}>
            <View style={styles.itemLeft}>
              <Ionicons name="briefcase" size={24} color="#6B46C1" />
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>Office</Text>
                <Text style={styles.itemSubtitle}>BKC Tech Park</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add-circle" size={20} color="#FF6B35" />
            <Text style={styles.addButtonText}>Add Other Location</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>
          
          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>Daily commute nudge</Text>
                <Text style={styles.itemSubtitle}>Morning & evening reminders</Text>
              </View>
            </View>
            <Switch
              value={dailyNudge}
              onValueChange={setDailyNudge}
              trackColor={{ false: '#E5E7EB', true: '#FF6B35' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>Surge alerts</Text>
                <Text style={styles.itemSubtitle}>When prices drop significantly</Text>
              </View>
            </View>
            <Switch
              value={surgeAlerts}
              onValueChange={setSurgeAlerts}
              trackColor={{ false: '#E5E7EB', true: '#FF6B35' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Privacy & Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Privacy & Data</Text>
          
          <TouchableOpacity style={styles.item}>
            <View style={styles.itemLeft}>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>View my data usage</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteButtonText}>Delete account & data</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.item} onPress={handleLogout}>
            <View style={styles.itemLeft}>
              <Ionicons name="log-out" size={24} color="#EF4444" />
              <Text style={[styles.itemTitle, { color: '#EF4444' }]}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>HailO v1.0.0</Text>
        <Text style={styles.versionSubtitle}>Mumbai's Commute Genius</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    padding: 24,
    paddingBottom: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  version: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
  },
  versionSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 32,
  },
});
