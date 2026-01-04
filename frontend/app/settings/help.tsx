import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: 'How does HailO compare ride prices?',
    answer: 'HailO aggregates real-time pricing from multiple ride-hailing platforms like Uber, Ola, and Rapido to show you the best available options for your route.',
  },
  {
    id: '2',
    question: 'What are Surge Alerts?',
    answer: 'Surge Alerts notify you when ride prices in your area are higher than usual. You can set up alerts to be notified when prices drop back to normal.',
  },
  {
    id: '3',
    question: 'How do I link my ride accounts?',
    answer: 'Go to Settings > Linked Accounts and tap on the service you want to connect. You\'ll be redirected to authorize HailO to access your account.',
  },
  {
    id: '4',
    question: 'Is my data secure?',
    answer: 'Yes! HailO uses industry-standard encryption to protect your personal information. We never share your data with third parties without your consent.',
  },
  {
    id: '5',
    question: 'How do I cancel a ride?',
    answer: 'Once you book a ride through HailO, you\'ll be redirected to the respective app (Uber, Ola, etc.) where you can manage or cancel your ride.',
  },
];

interface SupportOptionProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const SupportOption: React.FC<SupportOptionProps> = ({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  onPress,
}) => (
  <TouchableOpacity style={styles.supportOption} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.supportIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={22} color={iconColor} />
    </View>
    <View style={styles.supportInfo}>
      <Text style={styles.supportTitle}>{title}</Text>
      <Text style={styles.supportSubtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
  </TouchableOpacity>
);

export default function HelpScreen() {
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFAQs = FAQ_DATA.filter(
    faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@hailo.app?subject=HailO Support Request');
  };

  const handleCallSupport = () => {
    Alert.alert(
      'Call Support',
      'Would you like to call our support team?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL('tel:+911234567890') },
      ]
    );
  };

  const handleLiveChat = () => {
    Alert.alert(
      'Live Chat',
      'Live chat support is currently available from 9 AM to 9 PM IST.',
      [{ text: 'OK' }]
    );
  };

  const handleReportBug = () => {
    Alert.alert(
      'Report a Bug',
      'Thank you for helping us improve! Please describe the issue in detail.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: handleEmailSupport },
      ]
    );
  };

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for help..."
              placeholderTextColor={Colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={Colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Support Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GET HELP</Text>
          <View style={styles.sectionContent}>
            <SupportOption
              icon="chatbubbles"
              iconColor={Colors.primary.main}
              iconBg={Colors.primary.subtle}
              title="Live Chat"
              subtitle="Chat with our support team"
              onPress={handleLiveChat}
            />
            <SupportOption
              icon="mail"
              iconColor="#8B5CF6"
              iconBg="#EDE9FE"
              title="Email Support"
              subtitle="Get help via email"
              onPress={handleEmailSupport}
            />
            <SupportOption
              icon="call"
              iconColor="#10B981"
              iconBg="#D1FAE5"
              title="Call Us"
              subtitle="Speak to a representative"
              onPress={handleCallSupport}
            />
            <SupportOption
              icon="bug"
              iconColor="#EF4444"
              iconBg="#FEE2E2"
              title="Report a Bug"
              subtitle="Help us fix issues"
              onPress={handleReportBug}
            />
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
          <View style={styles.sectionContent}>
            {filteredFAQs.length === 0 ? (
              <View style={styles.noResults}>
                <Ionicons name="search" size={48} color={Colors.text.tertiary} />
                <Text style={styles.noResultsText}>No results found</Text>
                <Text style={styles.noResultsSubtext}>Try different keywords</Text>
              </View>
            ) : (
              filteredFAQs.map((faq, index) => (
                <TouchableOpacity
                  key={faq.id}
                  style={[
                    styles.faqItem,
                    index === filteredFAQs.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => toggleFAQ(faq.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Ionicons
                      name={expandedFAQ === faq.id ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={Colors.text.tertiary}
                    />
                  </View>
                  {expandedFAQ === faq.id && (
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Useful Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>USEFUL LINKS</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => Alert.alert('Terms of Service', 'Opening Terms of Service...')}
            >
              <Ionicons name="document-text" size={20} color={Colors.primary.main} />
              <Text style={styles.linkText}>Terms of Service</Text>
              <Ionicons name="open-outline" size={18} color={Colors.text.tertiary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => Alert.alert('Privacy Policy', 'Opening Privacy Policy...')}
            >
              <Ionicons name="shield-checkmark" size={20} color={Colors.primary.main} />
              <Text style={styles.linkText}>Privacy Policy</Text>
              <Ionicons name="open-outline" size={18} color={Colors.text.tertiary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.linkItem, { borderBottomWidth: 0 }]}
              onPress={() => Alert.alert('About HailO', 'HailO v1.0.0\n\nThe smart ride-hailing companion that helps you save money on every ride.')}
            >
              <Ionicons name="information-circle" size={20} color={Colors.primary.main} />
              <Text style={styles.linkText}>About HailO</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>HailO v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2025 HailO. All rights reserved.</Text>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
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
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  supportIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  supportInfo: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  supportSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  faqItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginTop: 12,
  },
  noResults: {
    padding: 32,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 12,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    gap: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.tertiary,
  },
  copyrightText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
});
