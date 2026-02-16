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
import { useSettings } from '../../contexts/SettingsContext';

export default function PrivacyScreen() {
  const router = useRouter();
  const { settings, updateSetting } = useSettings();

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Ride History',
      'This will permanently delete all your ride history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Success', 'Ride history cleared.') },
      ]
    );
  };

  const handleDownloadData = () => {
    Alert.alert('Download Data', 'Your data export will be sent to your registered email address.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Data Sharing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA SHARING</Text>
          <View style={styles.sectionContent}>
            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Share Ride History</Text>
                <Text style={styles.toggleSubtitle}>Allow friends to see your recent rides</Text>
              </View>
              <Switch
                value={settings.shareRideHistory}
                onValueChange={(v) => updateSetting('shareRideHistory', v)}
                trackColor={{ false: Colors.border.light, true: Colors.primary.light }}
                thumbColor={settings.shareRideHistory ? Colors.primary.main : '#f4f3f4'}
              />
            </View>

            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Share Location</Text>
                <Text style={styles.toggleSubtitle}>Enable real-time location sharing</Text>
              </View>
              <Switch
                value={settings.shareLocation}
                onValueChange={(v) => updateSetting('shareLocation', v)}
                trackColor={{ false: Colors.border.light, true: Colors.primary.light }}
                thumbColor={settings.shareLocation ? Colors.primary.main : '#f4f3f4'}
              />
            </View>

            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Personalized Ads</Text>
                <Text style={styles.toggleSubtitle}>See ads based on your activity</Text>
              </View>
              <Switch
                value={settings.personalizedAds}
                onValueChange={(v) => updateSetting('personalizedAds', v)}
                trackColor={{ false: Colors.border.light, true: Colors.primary.light }}
                thumbColor={settings.personalizedAds ? Colors.primary.main : '#f4f3f4'}
              />
            </View>

            <View style={[styles.toggleItem, { borderBottomWidth: 0 }]}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Analytics Sharing</Text>
                <Text style={styles.toggleSubtitle}>Help improve HailO with usage data</Text>
              </View>
              <Switch
                value={settings.analyticsSharing}
                onValueChange={(v) => updateSetting('analyticsSharing', v)}
                trackColor={{ false: Colors.border.light, true: Colors.primary.light }}
                thumbColor={settings.analyticsSharing ? Colors.primary.main : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Your Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR DATA</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.actionItem} onPress={handleDownloadData}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.primary.subtle }]}>
                <Ionicons name="download" size={22} color={Colors.primary.main} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Download My Data</Text>
                <Text style={styles.actionSubtitle}>Get a copy of your data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionItem, { borderBottomWidth: 0 }]} onPress={handleClearHistory}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="trash" size={22} color="#EF4444" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, { color: '#EF4444' }]}>Clear Ride History</Text>
                <Text style={styles.actionSubtitle}>Permanently delete all ride data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
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
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
});
