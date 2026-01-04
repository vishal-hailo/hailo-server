import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';

interface HelpItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const HelpItem: React.FC<HelpItemProps> = ({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  onPress,
}) => (
  <TouchableOpacity style={styles.helpItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.helpIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={22} color={iconColor} />
    </View>
    <View style={styles.helpInfo}>
      <Text style={styles.helpTitle}>{title}</Text>
      <Text style={styles.helpSubtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
  </TouchableOpacity>
);

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How does HailO save me money?',
    answer: 'HailO monitors surge pricing across multiple ride-hailing apps and alerts you when prices drop, helping you book at the optimal time.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we use industry-standard encryption to protect your data. We never share your personal information with third parties.',
  },
  {
    question: 'How do I link my ride-hailing accounts?',
    answer: 'Go to Settings > Linked Accounts and follow the prompts to connect your Uber, Ola, or Rapido accounts.',
  },
  {
    question: 'Can I schedule rides in advance?',
    answer: 'Yes! Use the calendar feature to schedule rides and we\'ll notify you when it\'s the best time to book.',
  },
];

export default function HelpSupportScreen() {
  const router = useRouter();

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@hailo.app?subject=Support Request');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+911234567890');
  };

  const handleChat = () => {
    Alert.alert('Live Chat', 'Live chat support will be available soon!');
  };

  const handleFAQ = (item: FAQItem) => {
    Alert.alert(item.question, item.answer);
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
        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTACT US</Text>
          <View style={styles.sectionContent}>
            <HelpItem
              icon="chatbubbles"
              iconColor="#10B981"
              iconBg="#D1FAE5"
              title="Live Chat"
              subtitle="Chat with our support team"
              onPress={handleChat}
            />
            <HelpItem
              icon="mail"
              iconColor={Colors.primary.main}
              iconBg={Colors.primary.subtle}
              title="Email Support"
              subtitle="support@hailo.app"
              onPress={handleContactSupport}
            />
            <HelpItem
              icon="call"
              iconColor="#F59E0B"
              iconBg="#FEF3C7"
              title="Call Us"
              subtitle="+91 1234 567 890"
              onPress={handleCallSupport}
            />
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
          <View style={styles.sectionContent}>
            {FAQ_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.faqItem,
                  index === FAQ_ITEMS.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => handleFAQ(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RESOURCES</Text>
          <View style={styles.sectionContent}>
            <HelpItem
              icon="book"
              iconColor="#8B5CF6"
              iconBg="#EDE9FE"
              title="User Guide"
              subtitle="Learn how to use HailO"
              onPress={() => Alert.alert('User Guide', 'User guide coming soon!')}
            />
            <HelpItem
              icon="document-text"
              iconColor="#6B7280"
              iconBg="#F3F4F6"
              title="Terms of Service"
              subtitle="Read our terms"
              onPress={() => Linking.openURL('https://hailo.app/terms')}
            />
            <HelpItem
              icon="shield"
              iconColor="#6B7280"
              iconBg="#F3F4F6"
              title="Privacy Policy"
              subtitle="How we protect your data"
              onPress={() => Linking.openURL('https://hailo.app/privacy')}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>HailO</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appTagline}>Your Daily Commute, Optimized.</Text>
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
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  helpIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  helpInfo: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  helpSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
});
