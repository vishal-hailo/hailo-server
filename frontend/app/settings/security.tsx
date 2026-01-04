import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';

export default function SecurityScreen() {
  const router = useRouter();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change functionality will be implemented soon.');
  };

  const handleChangePIN = () => {
    Alert.alert('Change PIN', 'PIN change functionality will be implemented soon.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Authentication */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AUTHENTICATION</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.settingsItem} onPress={handleChangePassword}>
              <View style={[styles.settingsIcon, { backgroundColor: Colors.primary.subtle }]}>
                <Ionicons name="key" size={22} color={Colors.primary.main} />
              </View>
              <View style={styles.settingsInfo}>
                <Text style={styles.settingsTitle}>Change Password</Text>
                <Text style={styles.settingsSubtitle}>Update your account password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem} onPress={handleChangePIN}>
              <View style={[styles.settingsIcon, { backgroundColor: Colors.primary.subtle }]}>
                <Ionicons name="keypad" size={22} color={Colors.primary.main} />
              </View>
              <View style={styles.settingsInfo}>
                <Text style={styles.settingsTitle}>Change PIN</Text>
                <Text style={styles.settingsSubtitle}>Update your 4-digit PIN</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Biometric & 2FA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ADDITIONAL SECURITY</Text>
          <View style={styles.sectionContent}>
            <View style={styles.toggleItem}>
              <View style={[styles.settingsIcon, { backgroundColor: Colors.primary.subtle }]}>
                <Ionicons name="finger-print" size={22} color={Colors.primary.main} />
              </View>
              <View style={styles.settingsInfo}>
                <Text style={styles.settingsTitle}>Biometric Login</Text>
                <Text style={styles.settingsSubtitle}>Use fingerprint or Face ID</Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: Colors.border.light, true: Colors.primary.light }}
                thumbColor={biometricEnabled ? Colors.primary.main : '#f4f3f4'}
              />
            </View>

            <View style={styles.toggleItem}>
              <View style={[styles.settingsIcon, { backgroundColor: Colors.primary.subtle }]}>
                <Ionicons name="shield-checkmark" size={22} color={Colors.primary.main} />
              </View>
              <View style={styles.settingsInfo}>
                <Text style={styles.settingsTitle}>Two-Factor Authentication</Text>
                <Text style={styles.settingsSubtitle}>Extra security for your account</Text>
              </View>
              <Switch
                value={twoFactorEnabled}
                onValueChange={setTwoFactorEnabled}
                trackColor={{ false: Colors.border.light, true: Colors.primary.light }}
                thumbColor={twoFactorEnabled ? Colors.primary.main : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Active Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACTIVE SESSIONS</Text>
          <View style={styles.sectionContent}>
            <View style={styles.sessionItem}>
              <View style={[styles.settingsIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="phone-portrait" size={22} color="#10B981" />
              </View>
              <View style={styles.settingsInfo}>
                <Text style={styles.settingsTitle}>This Device</Text>
                <Text style={styles.settingsSubtitle}>Active now • Mumbai, India</Text>
              </View>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Current</Text>
              </View>
            </View>
          </View>
        </View>

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
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingsInfo: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
});
