import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, Droplet, Search, ChevronRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* Decorative background shapes for premium aesthetics */}
      <View style={styles.bgBlobLeft} />
      <View style={styles.bgBlobRight} />

      <View style={styles.content}>
        {/* Upper Hero Branding Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoGraphic}>
              {/* Eye icon in sky blue */}
              <Eye size={72} color="#0EA5E9" style={{ position: 'absolute', top: 4, left: 4 }} />
              {/* Blood droplet icon in red (filled) */}
              <Droplet size={34} color="#EF4444" fill="#EF4444" style={{ position: 'absolute', top: 22, left: 22 }} />
              {/* Magnifying search icon in dark navy */}
              <Search size={26} color="#1E293B" strokeWidth={3} style={{ position: 'absolute', bottom: 4, right: 4 }} />
            </View>
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoTextMain}>Anemia</Text>
              <Text style={styles.logoTextSub}>Vision</Text>
            </View>
          </View>
        </View>

        {/* Text Messaging Card */}
        <View style={styles.textCard}>
          <Text style={styles.smallHeading}>SISTEM SKRINING KESEHATAN SEKOLAH</Text>
          <Text style={styles.largeHeading}>
            Lindungi Generasi Penerus dari Risiko Anemia
          </Text>
          <Text style={styles.description}>
            Lakukan skrining berkala menggunakan teknologi deteksi dini berbasis AI non-invasif untuk memantau kesehatan siswi dengan cepat, akurat, dan aman.
          </Text>
        </View>

        {/* Bottom Actions Area */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.ctaButton} 
            onPress={() => router.push('/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaButtonText}>Setuju dan Lanjutkan</Text>
            <View style={styles.ctaIconBadge}>
              <ChevronRight size={18} color="#0D9488" strokeWidth={3} />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.legalNotice}>
            Dengan melanjutkan, Anda menyetujui kebijakan privasi dan pemrosesan data skrining di lingkungan sekolah.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'space-between',
  },
  bgBlobLeft: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#E0F2FE',
    opacity: 0.5,
    zIndex: -1,
  },
  bgBlobRight: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#CCFBF1',
    opacity: 0.5,
    zIndex: -1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: Platform.OS === 'ios' ? 20 : 36,
  },
  heroSection: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoGraphic: {
    width: 80,
    height: 80,
    position: 'relative',
    marginBottom: 20,
  },
  logoTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTextMain: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  logoTextSub: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  textCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  smallHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 2.5,
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  largeHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 16,
  },
  description: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  actionContainer: {
    justifyContent: 'flex-end',
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
  },
  ctaButton: {
    flexDirection: 'row',
    backgroundColor: '#0D9488',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 18,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 10,
  },
  ctaIconBadge: {
    backgroundColor: '#FFFFFF',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalNotice: {
    fontSize: 10.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },
});
