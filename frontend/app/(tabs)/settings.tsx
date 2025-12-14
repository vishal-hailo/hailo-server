import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

// API_URL from environment variable
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function SettingsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailyNudge, setDailyNudge] = useState(true);
  const [surgeAlerts, setSurgeAlerts] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }

      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/api/v1/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocations(response.data || []);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

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
              await AsyncStorage.multiRemove([
                'authToken',
                'user',
                'locationsSetup',
                'onboardingCompleted'
              ]);
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

  const getIconForType = (type: string) => {
    if (type === 'HOME') return 'home';
    if (type === 'OFFICE') return 'briefcase';
    return 'location';
  };

  const getColorForType = (type: string) => {
    if (type === 'HOME') return '#FF6B35';
    if (type === 'OFFICE') return '#6B46C1';
    return '#10B981';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          {user && (
            <View style={styles.userBadge}>
              <Ionicons name="person-circle" size={24} color="#FF6B35" />
              <Text style={styles.userName}>{user.name}</Text>
            </View>
          )}
        </View>

        {/* Saved Locations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📍 Saved Locations</Text>
            <TouchableOpacity onPress={() => router.push('/locations-manager')}>
              <Ionicons name="settings-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="small" color="#FF6B35" style={{ paddingVertical: 20 }} />
          ) : locations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No locations saved yet</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/locations-manager')}
              >
                <Ionicons name="add-circle" size={20} color="#FF6B35" />
                <Text style={styles.addButtonText}>Add Location</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {locations.slice(0, 3).map((location: any) => (
                <TouchableOpacity
                  key={location.id}
                  style={styles.item}
                  onPress={() => router.push('/locations-manager')}
                >
                  <View style={styles.itemLeft}>
                    <Ionicons
                      name={getIconForType(location.type)}
                      size={24}
                      color={getColorForType(location.type)}
                    />
                    <View style={styles.itemText}>
                      <Text style={styles.itemTitle}>{location.label}</Text>
                      <Text style={styles.itemSubtitle} numberOfLines={1}>
                        {location.address}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </TouchableOpacity>
              ))}

              {locations.length > 3 && (
                <Text style={styles.moreText}>+{locations.length - 3} more locations</Text>
              )}

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/locations-manager')}
              >
                <Ionicons name="add-circle" size={20} color="#FF6B35" />
                <Text style={styles.addButtonText}>Manage Locations</Text>
              </TouchableOpacity>
            </>
          )}
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
  header: {
    padding: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
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
  moreText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 8,
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
