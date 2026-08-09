import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Mail, MessageCircle, BookOpen, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.sectionCard}>{children}</View>;
}

function BodyText({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[styles.bodyText, style]}>{children}</Text>;
}

function BulletItem({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>{'\u2022'}</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <View style={styles.faqItem}>
      <View style={styles.faqQuestion}>
        <HelpCircle size={14} color="#26335F" style={{ marginTop: 2 }} />
        <Text style={styles.faqQuestionText}>{question}</Text>
      </View>
      <Text style={styles.faqAnswerText}>{answer}</Text>
    </View>
  );
}

export default function SupportScreen() {
  const router = useRouter();

  const canGoBack = router.canGoBack?.() ?? false;

  return (
    <View style={styles.root} testID="support-screen">
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <LinearGradient colors={['#FFFFFF', '#F3F4F6']} style={styles.header}>
          {canGoBack ? (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
              testID="support-back-button"
            >
              <ArrowLeft size={20} color="#111827" />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Support</Text>
            <Text style={styles.headerSubtitle}>KEL Smart App</Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title block */}
        <View style={styles.titleBlock}>
          <Text style={styles.pageTitle}>KEL Smart Support Center</Text>
          <Text style={styles.subtitle}>
            We're here to help you get the most out of your tank monitoring system.
          </Text>
        </View>

        {/* Contact Support */}
        <SectionHeader title="Contact Us" />
        <SectionCard>
          <BodyText>Our support team is available to assist you with any questions or issues.</BodyText>
          <Pressable
            style={({ pressed }) => [styles.contactButton, pressed && { opacity: 0.7 }]}
            onPress={() => Linking.openURL('mailto:support@kel-electronics.com')}
          >
            <Mail size={18} color="#26335F" />
            <Text style={styles.contactButtonText}>support@kel-electronics.com</Text>
          </Pressable>
          <View style={styles.responseInfo}>
            <CheckCircle size={13} color="#4ADE80" />
            <Text style={styles.responseInfoText}>We typically respond within 24–48 hours</Text>
          </View>
        </SectionCard>

        {/* What to Include */}
        <SectionHeader title="When Contacting Support" />
        <SectionCard>
          <BodyText>To help us resolve your issue faster, please include:</BodyText>
          <BulletItem text="Your registered email address" />
          <BulletItem text="Description of the issue you are experiencing" />
          <BulletItem text="Your device model and iOS version" />
          <BulletItem text="App version (found in Settings)" />
          <BulletItem text="Screenshots or screen recordings if applicable" />
        </SectionCard>

        {/* FAQ */}
        <SectionHeader title="Frequently Asked Questions" />
        <SectionCard>
          <FAQItem
            question="How do I add a new tank to monitor?"
            answer="Go to the Dashboard tab and tap the '+' button in the top right corner. Enter your tank details and sensor information to start monitoring."
          />
          <View style={styles.divider} />
          <FAQItem
            question="My sensor data is not updating. What should I do?"
            answer="First, check that your ESP32 sensor device is powered on and connected to your Wi-Fi network. Ensure the sensor ID in the app matches your device. If the issue persists, contact support."
          />
          <View style={styles.divider} />
          <FAQItem
            question="How do I set up alert thresholds?"
            answer="Open any tank from the Dashboard, scroll to the Alerts section, and configure your minimum and maximum thresholds for level, temperature, and other parameters."
          />
          <View style={styles.divider} />
          <FAQItem
            question="Can I share access to my tanks with others?"
            answer="Yes. Go to Settings → Team Management to invite other users to your organization and assign them appropriate access levels."
          />
          <View style={styles.divider} />
          <FAQItem
            question="How do I delete my account?"
            answer="Go to Settings → Account → Delete Account. This will permanently delete your account and all associated data within 30 days."
          />
          <View style={styles.divider} />
          <FAQItem
            question="I forgot my password. How do I reset it?"
            answer="On the login screen, tap 'Forgot Password' and enter your email address. You will receive a reset link within a few minutes."
          />
        </SectionCard>

        {/* Troubleshooting */}
        <SectionHeader title="Troubleshooting" />
        <SectionCard>
          <View style={styles.troubleshootRow}>
            <AlertCircle size={15} color="#26335F" />
            <Text style={[styles.bodyText, { marginLeft: 8, flex: 1, marginBottom: 0 }]}>
              App not loading data?
            </Text>
          </View>
          <BodyText style={{ marginTop: 4, paddingLeft: 23 }}>
            Pull down to refresh on the Dashboard screen or go to Settings and tap "Sync Data".
          </BodyText>

          <View style={[styles.troubleshootRow, { marginTop: 12 }]}>
            <AlertCircle size={15} color="#26335F" />
            <Text style={[styles.bodyText, { marginLeft: 8, flex: 1, marginBottom: 0 }]}>
              Notifications not working?
            </Text>
          </View>
          <BodyText style={{ marginTop: 4, paddingLeft: 23 }}>
            Go to your iPhone Settings → KEL Smart → Notifications and ensure notifications are enabled.
          </BodyText>

          <View style={[styles.troubleshootRow, { marginTop: 12 }]}>
            <AlertCircle size={15} color="#26335F" />
            <Text style={[styles.bodyText, { marginLeft: 8, flex: 1, marginBottom: 0 }]}>
              Login issues?
            </Text>
          </View>
          <BodyText style={{ marginTop: 4, paddingLeft: 23 }}>
            Make sure you are using the correct email address. Try the 'Forgot Password' option or contact support if you are locked out.
          </BodyText>
        </SectionCard>

        {/* About */}
        <SectionHeader title="About KEL Smart" />
        <SectionCard>
          <BodyText>
            KEL Smart is a professional tank monitoring solution developed by KEL Electronic Solution.
            The app connects to ESP32-based sensors to provide real-time data on tank levels,
            temperature, and other critical parameters.
          </BodyText>
          <View style={styles.contactBlock}>
            <Text style={styles.contactCompany}>KEL Electronic Solution</Text>
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>Support: </Text>
              <Text style={styles.amberText}>support@kel-electronics.com</Text>
            </View>
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>Privacy: </Text>
              <Text style={styles.amberText}>privacy@kel-electronics.com</Text>
            </View>
          </View>
        </SectionCard>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2026 K.E.L. Electronic Solution. All rights reserved.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const AMBER = '#26335F';
const AMBER_BG = '#FEF3C7';
const BG_DARK = '#FFFFFF';
const BG_MID = '#F8F9FA';
const BORDER = '#E5E7EB';
const SURFACE_MUTED = '#F3F4F6';
const TEXT_WHITE = '#111827';
const TEXT_LIGHT = '#4B5563';
const TEXT_MUTED = '#9CA3AF';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG_MID,
  },
  safeTop: {
    backgroundColor: BG_DARK,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SURFACE_MUTED,
    borderRadius: 10,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'IBMPlexMono_700Bold',
    color: TEXT_WHITE,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: TEXT_LIGHT,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  titleBlock: {
    backgroundColor: BG_DARK,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: AMBER,
  },
  pageTitle: {
    fontSize: 18,
    fontFamily: 'IBMPlexMono_700Bold',
    color: TEXT_WHITE,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: TEXT_LIGHT,
    lineHeight: 20,
  },
  sectionHeader: {
    borderLeftWidth: 4,
    borderLeftColor: AMBER,
    paddingLeft: 10,
    marginBottom: 8,
    marginTop: 4,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontFamily: 'IBMPlexMono_700Bold',
    color: AMBER,
    letterSpacing: 0.3,
  },
  sectionCard: {
    backgroundColor: BG_DARK,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: TEXT_LIGHT,
    lineHeight: 20,
    marginBottom: 6,
  },
  amberText: {
    color: AMBER,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
    paddingLeft: 4,
  },
  bulletDot: {
    color: AMBER,
    fontSize: 14,
    lineHeight: 20,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: TEXT_LIGHT,
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AMBER_BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AMBER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 8,
    gap: 10,
  },
  contactButtonText: {
    fontSize: 14,
    fontFamily: 'IBMPlexMono_700Bold',
    color: AMBER,
    letterSpacing: 0.3,
  },
  responseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  responseInfoText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#4ADE80',
  },
  faqItem: {
    marginBottom: 2,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: TEXT_WHITE,
    lineHeight: 20,
  },
  faqAnswerText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: TEXT_LIGHT,
    lineHeight: 20,
    paddingLeft: 22,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 12,
  },
  troubleshootRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactBlock: {
    backgroundColor: SURFACE_MUTED,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    gap: 6,
  },
  contactCompany: {
    fontSize: 14,
    fontFamily: 'IBMPlexMono_700Bold',
    color: TEXT_WHITE,
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: TEXT_LIGHT,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    marginTop: 8,
  },
  footerText: {
    fontSize: 11,
    fontFamily: 'IBMPlexMono_700Bold',
    color: TEXT_MUTED,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
