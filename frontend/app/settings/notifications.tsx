import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';

interface NotificationItemProps {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  title,
  subtitle,
  value,
  onValueChange,
}) => (
  <View style={styles.notificationItem}>
    <View style={styles.notificationInfo}>
      <Text style={styles.notificationTitle}>{title}</Text>
      <Text style={styles.notificationSubtitle}>{subtitle}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: Colors.border.light, true: Colors.primary.light }}
      thumbColor={value ? Colors.primary.main : '#f4f3f4'}
    />
  </View>
);

export default function NotificationsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    surgeAlerts: true,
    priceDrops: true,
    rideReminders: true,
    promotions: false,
    weeklyReports: true,
    pushNotifications: true,
    emailNotifications: false,
    smsNotifications: false,
  });

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Alert Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ALERT TYPES</Text>
          <View style={styles.sectionContent}>
            <NotificationItem
              title="Surge Alerts"
              subtitle="Get notified when surge pricing changes"
              value={settings.surgeAlerts}
              onValueChange={(v) => updateSetting('surgeAlerts', v)}
            />
            <NotificationItem
              title="Price Drops"
              subtitle="Alert when ride prices decrease"
              value={settings.priceDrops}
              onValueChange={(v) => updateSetting('priceDrops', v)}
            />
            <NotificationItem
              title="Ride Reminders"
              subtitle="Reminders for scheduled rides"
              value={settings.rideReminders}
              onValueChange={(v) => updateSetting('rideReminders', v)}
            />
            <NotificationItem
              title="Promotions & Offers"
              subtitle="Special deals and discounts"
              value={settings.promotions}
              onValueChange={(v) => updateSetting('promotions', v)}
            />
            <NotificationItem
              title="Weekly Reports"
              subtitle="Summary of your rides and savings"
              value={settings.weeklyReports}
              onValueChange={(v) => updateSetting('weeklyReports', v)}
            />
          </View>
        </View>

        {/* Notification Channels */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATION CHANNELS</Text>
          <View style={styles.sectionContent}>
            <NotificationItem
              title="Push Notifications"
              subtitle="Receive alerts on your device"
              value={settings.pushNotifications}
              onValueChange={(v) => updateSetting('pushNotifications', v)}
            />
            <NotificationItem
              title="Email Notifications"
              subtitle="Receive alerts via email"
              value={settings.emailNotifications}
              onValueChange={(v) => updateSetting('emailNotifications', v)}
            />
            <NotificationItem
              title="SMS Notifications"
              subtitle="Receive alerts via text message"
              value={settings.smsNotifications}
              onValueChange={(v) => updateSetting('smsNotifications', v)}
            />
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
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  notificationSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
});
