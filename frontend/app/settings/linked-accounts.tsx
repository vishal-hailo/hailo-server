import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../constants/Config';
import Colors from '../../constants/Colors';

interface LinkedAccount {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  isLinked: boolean;
  email?: string;
}

export default function LinkedAccountsScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<LinkedAccount[]>([
    {
      id: 'uber',
      name: 'Uber',
      icon: 'car-sport',
      color: '#000000',
      bgColor: '#F3F4F6',
      isLinked: false,
    },
    {
      id: 'ola',
      name: 'Ola',
      icon: 'car',
      color: '#4CAF50',
      bgColor: '#E8F5E9',
      isLinked: false,
    },
    {
      id: 'rapido',
      name: 'Rapido',
      icon: 'bicycle',
      color: '#FF9800',
      bgColor: '#FFF3E0',
      isLinked: false,
    },
  ]);

  const { status, platform, message } = useLocalSearchParams();

  // Handle deep link return
  useEffect(() => {
    if (status === 'success' && platform === 'uber') {
      Alert.alert('Success', 'Uber account linked successfully!');
      // Refresh local state or refetch user profile
      setAccounts(prev => prev.map(a => a.id === 'uber' ? { ...a, isLinked: true } : a));
      // Ideally fetch real profile status here
      checkLinkStatus();
    } else if (status === 'error') {
      Alert.alert('Linking Failed', (message as string) || 'Could not link account.');
    }
  }, [status, platform, message]);

  const checkLinkStatus = async () => {
    // Basic check - in real app, fetch /api/v1/auth/me and check linkedAccounts
  };

  const handleLinkAccount = async (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);

    if (account?.isLinked) {
      Alert.alert(
        'Unlink Account',
        `Are you sure you want to unlink your ${account.name} account?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unlink',
            style: 'destructive',
            onPress: async () => {
              if (accountId === 'uber') {
                // Call backend to disconnect
                try {
                  // Need access to API calling function with token
                  // For now just simulate UI update + basic fetch
                  // await axios.post(`${API_URL}/api/v1/auth/uber/disconnect`, ...);
                } catch (e) { }
              }
              setAccounts(prev =>
                prev.map(a => (a.id === accountId ? { ...a, isLinked: false, email: undefined } : a))
              );
            },
          },
        ]
      );
    } else {
      if (accountId === 'uber') {
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (!token) return;

          // Get Auth URL
          // Hardcode IP for dev if localhost issues, but try proxy first
          // Note: ensure your backend .env UBER_REDIRECT_URI matches what you registered
          const response = await fetch(`${API_URL}/api/v1/auth/uber/url`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await response.json();

          if (data.url) {
            const result = await Linking.openURL(data.url);
          } else {
            Alert.alert('Error', 'Could not initiate linking');
          }
        } catch (error) {
          Alert.alert('Error', 'Failed to connect to server');
        }
      } else {
        Alert.alert('Coming Soon', `${account?.name} integration is coming soon!`);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Linked Accounts</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary.main} />
          <Text style={styles.infoText}>
            Link your ride-hailing accounts to compare prices and book rides directly from HailO.
          </Text>
        </View>

        {/* Accounts List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RIDE-HAILING APPS</Text>
          <View style={styles.sectionContent}>
            {accounts.map((account, index) => (
              <TouchableOpacity
                key={account.id}
                style={[
                  styles.accountItem,
                  index === accounts.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => handleLinkAccount(account.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.accountIcon, { backgroundColor: account.bgColor }]}>
                  <Ionicons name={account.icon as any} size={24} color={account.color} />
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  {account.isLinked ? (
                    <Text style={styles.accountEmail}>{account.email}</Text>
                  ) : (
                    <Text style={styles.accountStatus}>Not linked</Text>
                  )}
                </View>
                {account.isLinked ? (
                  <View style={styles.linkedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.linkedText}>Linked</Text>
                  </View>
                ) : (
                  <View style={styles.linkButton}>
                    <Text style={styles.linkButtonText}>Link</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
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
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  accountStatus: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  linkButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
});
