import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
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

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.highlightWrap}>
      <Text style={styles.highlightText}>{children}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <View style={styles.root} testID="privacy-policy-screen">
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <LinearGradient colors={['#FFFFFF', '#F3F4F6']} style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            testID="privacy-policy-back-button"
          >
            <ArrowLeft size={20} color="#111827" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Privacy Policy</Text>
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
          <Text style={styles.pageTitle}>Privacy Policy for KEL Smart</Text>
          <Text style={styles.lastUpdated}>Last Updated: March 21, 2026</Text>
        </View>

        {/* 1. Information We Collect */}
        <SectionHeader title="1. Information We Collect" />
        <SectionCard>
          <BodyText>We collect the following types of information to provide and improve our services:</BodyText>
          <Text style={[styles.bodyText, styles.subHeading]}>Personal Information</Text>
          <BulletItem text="Email address" />
          <BulletItem text="Password (stored securely via Firebase Auth)" />
          <BulletItem text="Full name" />
          <BulletItem text="Company name" />
          <BulletItem text="Phone number" />
          <Text style={[styles.bodyText, styles.subHeading]}>Tank Monitoring Data</Text>
          <BulletItem text="Tank configurations and settings" />
          <BulletItem text="Sensor data and readings" />
          <BulletItem text="Historical monitoring data" />
          <BulletItem text="Alert settings and thresholds" />
          <BulletItem text="Sensor information and metadata" />
          <Text style={[styles.bodyText, styles.subHeading]}>Device & Usage Information</Text>
          <BulletItem text="Device information (type, OS version)" />
          <BulletItem text="Usage data and app interaction patterns" />
        </SectionCard>

        {/* 2. How We Use Your Information */}
        <SectionHeader title="2. How We Use Your Information" />
        <SectionCard>
          <BulletItem text="Service provision — operating and maintaining the KEL Smart monitoring platform" />
          <BulletItem text="Service improvement — analyzing usage to enhance features and reliability" />
          <BulletItem text="Communication — sending alerts, notifications, and support responses" />
          <BulletItem text="Security and compliance — protecting accounts and meeting legal obligations" />
        </SectionCard>

        {/* 3. Data Storage and Security */}
        <SectionHeader title="3. Data Storage and Security" />
        <SectionCard>
          <BodyText>Your data is stored and protected using industry-standard practices:</BodyText>
          <BulletItem text="Stored on Google Firebase infrastructure" />
          <BulletItem text="SSL/TLS encryption for all data in transit" />
          <BulletItem text="Firebase Authentication for secure account management" />
          <BulletItem text="Role-based access controls" />
          <BulletItem text="Firebase security rules to restrict unauthorized access" />
        </SectionCard>

        {/* 4. Data Sharing and Disclosure */}
        <SectionHeader title="4. Data Sharing and Disclosure" />
        <SectionCard>
          <Highlight>We do NOT sell your personal data to third parties.</Highlight>
          <BodyText>We share data only in limited circumstances:</BodyText>
          <BulletItem text="Google Firebase — for hosting, database, and authentication services" />
          <BulletItem text="Legal requirements — when required by law or to protect our legal rights" />
          <BulletItem text="Business transfers — in connection with a merger, acquisition, or sale of assets" />
        </SectionCard>

        {/* 5. Your Data Rights and Choices */}
        <SectionHeader title="5. Your Data Rights and Choices" />
        <SectionCard>
          <BodyText>You have the right to:</BodyText>
          <BulletItem text="Access — view the personal data we hold about you" />
          <BulletItem text="Update — correct or update your information via the app" />
          <BulletItem text="Delete — request deletion of your account and data" />
          <BulletItem text="Export — request a copy of your data" />
          <BodyText style={{ marginTop: 10 }}>
            To delete your account, go to Settings → Account → Delete Account, or contact us at{' '}
            <Text style={styles.amberText}>support@kel-electronics.com</Text>.
            All data will be permanently deleted within 30 days of your request.
          </BodyText>
        </SectionCard>

        {/* 6. Third-Party Services */}
        <SectionHeader title="6. Third-Party Services" />
        <SectionCard>
          <BodyText>KEL Smart integrates with the following third-party services:</BodyText>
          <BulletItem text="Firebase (Google Cloud) — infrastructure, authentication, and database" />
          <BulletItem text="ESP32 Sensors — hardware sensors for tank monitoring data collection" />
          <BodyText style={{ marginTop: 10 }}>
            These services have their own privacy policies. We encourage you to review them.
          </BodyText>
        </SectionCard>

        {/* 7. Children's Privacy */}
        <SectionHeader title="7. Children's Privacy" />
        <SectionCard>
          <BodyText>
            KEL Smart is not directed to children under the age of 13. We do not knowingly collect personal
            information from children. If you believe a child has provided us with personal information, please
            contact us immediately and we will take steps to delete such information.
          </BodyText>
        </SectionCard>

        {/* 8. International Data Transfers */}
        <SectionHeader title="8. International Data Transfers" />
        <SectionCard>
          <BodyText>
            Your data may be stored and processed in the United States through Google Firebase infrastructure.
            By using KEL Smart, you consent to the transfer of your information to the US and other countries
            where Firebase operates.
          </BodyText>
        </SectionCard>

        {/* 9. California Privacy Rights (CCPA) */}
        <SectionHeader title="9. California Privacy Rights (CCPA)" />
        <SectionCard>
          <BodyText>California residents have the following rights under the CCPA:</BodyText>
          <BulletItem text="Right to Know — what personal information we collect and how it is used" />
          <BulletItem text="Right to Delete — request deletion of your personal information" />
          <BulletItem text="Right to Opt-Out — we do not sell personal information, so this does not apply" />
          <BulletItem text="Right to Non-Discrimination — we will not discriminate against you for exercising your rights" />
          <BodyText style={{ marginTop: 10 }}>
            To exercise these rights, contact us at{' '}
            <Text style={styles.amberText}>privacy@kel-electronics.com</Text>.
          </BodyText>
        </SectionCard>

        {/* 10. European Privacy Rights (GDPR) */}
        <SectionHeader title="10. European Privacy Rights (GDPR)" />
        <SectionCard>
          <BodyText>If you are located in the European Economic Area, you have the following rights:</BodyText>
          <BulletItem text="Right of Access — obtain a copy of your personal data" />
          <BulletItem text="Right to Rectification — correct inaccurate data" />
          <BulletItem text="Right to Erasure — request deletion of your data" />
          <BulletItem text="Right to Restriction — limit how we process your data" />
          <BulletItem text="Right to Data Portability — receive your data in a portable format" />
          <BulletItem text="Right to Object — object to processing based on legitimate interests" />
          <BulletItem text="Right to Withdraw Consent — withdraw consent at any time" />
          <BodyText style={{ marginTop: 10 }}>
            To exercise these rights, contact us at{' '}
            <Text style={styles.amberText}>privacy@kel-electronics.com</Text>.
          </BodyText>
        </SectionCard>

        {/* 11. Changes to This Privacy Policy */}
        <SectionHeader title="11. Changes to This Privacy Policy" />
        <SectionCard>
          <BodyText>
            We may update this Privacy Policy from time to time. When we do, we will:
          </BodyText>
          <BulletItem text="Notify you via an in-app notification" />
          <BulletItem text="Update the 'Last Updated' date at the top of this policy" />
          <BulletItem text="Send an email notification for significant changes" />
          <BodyText style={{ marginTop: 10 }}>
            Continued use of KEL Smart after changes constitutes acceptance of the updated policy.
          </BodyText>
        </SectionCard>

        {/* 12. Data Breach Notification */}
        <SectionHeader title="12. Data Breach Notification" />
        <SectionCard>
          <BodyText>
            In the event of a data breach that affects your personal information, we will notify affected users
            within{' '}
            <Text style={styles.amberText}>72 hours</Text>{' '}
            of becoming aware of the breach, in accordance with applicable data protection laws.
          </BodyText>
        </SectionCard>

        {/* 13. Contact Us */}
        <SectionHeader title="13. Contact Us" />
        <SectionCard>
          <BodyText>If you have any questions or concerns about this Privacy Policy, please contact us:</BodyText>
          <View style={styles.contactBlock}>
            <Text style={styles.contactCompany}>KEL Electronic Solution</Text>
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>Privacy: </Text>
              <Text style={styles.amberText}>privacy@kel-electronics.com</Text>
            </View>
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>Support: </Text>
              <Text style={styles.amberText}>support@kel-electronics.com</Text>
            </View>
            <Text style={styles.contactNote}>We aim to respond within 48 hours.</Text>
          </View>
        </SectionCard>

        {/* 14. Your Consent */}
        <SectionHeader title="14. Your Consent" />
        <SectionCard>
          <BodyText>
            By using the KEL Smart application, you acknowledge that you have read, understood, and agree to
            the practices described in this Privacy Policy. If you do not agree with these terms, please
            discontinue use of the application.
          </BodyText>
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

const AMBER = '#F59E0B';
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
  lastUpdated: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: AMBER,
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
  subHeading: {
    color: TEXT_WHITE,
    fontFamily: 'Inter_700Bold',
    marginTop: 10,
    marginBottom: 4,
  },
  amberText: {
    color: AMBER,
    fontFamily: 'Inter_600SemiBold',
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
    marginTop: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: TEXT_LIGHT,
    lineHeight: 20,
  },
  highlightWrap: {
    backgroundColor: AMBER_BG,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  highlightText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: AMBER,
    lineHeight: 18,
  },
  contactBlock: {
    backgroundColor: SURFACE_MUTED,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
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
  contactNote: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: TEXT_LIGHT,
    marginTop: 4,
    fontStyle: 'italic',
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
