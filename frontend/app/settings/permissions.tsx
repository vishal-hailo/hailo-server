import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import Colors from '../../constants/Colors';

interface Permission {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  status: 'granted' | 'denied' | 'undetermined';
}

export default function PermissionsScreen() {
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'location',
      name: 'Location',
      description: 'Required for ride booking and surge detection',
      icon: 'location',
      status: 'undetermined',
    },
    {
      id: 'contacts',
      name: 'Contacts',
      description: 'Share rides and split fares with friends',
      icon: 'people',
      status: 'undetermined',
    },
    {
      id: 'notifications',
      name: 'Notifications',
      description: 'Receive surge alerts and ride updates',
      icon: 'notifications',
      status: 'undetermined',
    },
  ]);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      // Check location permission
      const locationStatus = await Location.getForegroundPermissionsAsync();
      
      // Check contacts permission
      const contactsStatus = await Contacts.getPermissionsAsync();

      setPermissions(prev => prev.map(p => {
        if (p.id === 'location') {
          return { ...p, status: locationStatus.granted ? 'granted' : locationStatus.canAskAgain ? 'undetermined' : 'denied' };
        }
        if (p.id === 'contacts') {
          return { ...p, status: contactsStatus.granted ? 'granted' : contactsStatus.canAskAgain ? 'undetermined' : 'denied' };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const handlePermissionPress = async (permissionId: string) => {
    try {
      if (permissionId === 'location') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermissions(prev => prev.map(p => 
          p.id === 'location' ? { ...p, status: status === 'granted' ? 'granted' : 'denied' } : p
        ));
      } else if (permissionId === 'contacts') {
        const { status } = await Contacts.requestPermissionsAsync();
        setPermissions(prev => prev.map(p => 
          p.id === 'contacts' ? { ...p, status: status === 'granted' ? 'granted' : 'denied' } : p
        ));
      } else {
        // For notifications and other permissions, open settings
        if (Platform.OS === 'ios') {
          Linking.openURL('app-settings:');
        } else {
          Linking.openSettings();
        }
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'granted':
        return '#10B981';
      case 'denied':
        return '#EF4444';
      default:
        return Colors.text.tertiary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'granted':
        return 'Allowed';
      case 'denied':
        return 'Denied';
      default:
        return 'Not Set';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Permissions</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.primary.main} />
          <Text style={styles.infoText}>
            HailO only requests permissions necessary for core features. You can change these anytime.
          </Text>
        </View>

        {/* Permissions List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APP PERMISSIONS</Text>
          <View style={styles.sectionContent}>
            {permissions.map((permission, index) => (
              <TouchableOpacity
                key={permission.id}
                style={[
                  styles.permissionItem,
                  index === permissions.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => handlePermissionPress(permission.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.permissionIcon, { backgroundColor: Colors.primary.subtle }]}>
                  <Ionicons name={permission.icon} size={22} color={Colors.primary.main} />
                </View>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionName}>{permission.name}</Text>
                  <Text style={styles.permissionDescription}>{permission.description}</Text>
                </View>
                <View style={styles.statusContainer}>
                  <Text style={[styles.statusText, { color: getStatusColor(permission.status) }]}>
                    {getStatusText(permission.status)}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => Linking.openSettings()}
        >
          <Ionicons name="settings" size={20} color={Colors.primary.main} />
          <Text style={styles.settingsButtonText}>Open Device Settings</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primary.subtle,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.tertiary,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  permissionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.subtle,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  settingsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary.main,
  },
});
