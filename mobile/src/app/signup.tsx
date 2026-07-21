import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Copyright } from '@/components/Copyright';

export default function SignupScreen() {
  const router = useRouter();

  return (
    <SafeAreaView testID="signup-screen" style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Access</Text>
          <Text style={styles.cardBody}>
            KEL Smart accounts are provisioned by your company administrator. If you need access, please contact your system administrator or reach out to our support team.
          </Text>

          {/* Contact Support Button */}
          <Pressable
            testID="contact-support-button"
            style={({ pressed }) => [styles.supportBtn, pressed && { opacity: 0.85 }]}
            onPress={() =>
              Linking.openURL('mailto:support@kel-es.com?subject=KEL Smart Access Request')
            }
          >
            <Text style={styles.supportBtnText}>Contact Support</Text>
          </Pressable>

          {/* Back to Sign In */}
          <Pressable
            testID="back-to-signin-link"
            onPress={() => router.back()}
            style={styles.backRow}
            hitSlop={8}
          >
            <Text style={styles.backLink}>Back to Sign In</Text>
          </Pressable>
        </View>

        <Copyright />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#252525',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  logoImage: {
    width: 220,
    height: 100,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 24,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  cardBody: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#9CA3AF',
    lineHeight: 22,
    marginBottom: 28,
  },
  supportBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 16,
  },
  supportBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#0D1117',
    letterSpacing: 0.3,
  },
  backRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backLink: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#F59E0B',
  },
});
