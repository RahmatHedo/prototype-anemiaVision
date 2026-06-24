import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Dimensions, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { useAuth } from './_layout';
import { Shield, Eye, EyeOff, User, Lock, Droplet, Search } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('kader'); // 'kader', 'tbms', 'sekolah', 'admin'
  const [error, setError] = useState('');
  
  // Focus States for Premium Input Fields
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Splash Transition States
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [splashProgress, setSplashProgress] = useState(0);
  const [splashStatus, setSplashStatus] = useState('');

  const handleLogin = () => {
    try {
      setError('');
      setIsLoggingIn(true);
      setSplashProgress(0.05);
      setSplashStatus('Menginisialisasi sistem otentikasi...');

      let name = 'Maya';
      if (selectedRole === 'tbms') name = 'Tim TBM Husada';
      if (selectedRole === 'sekolah') name = 'Kepala SMPN X Palembang';
      if (selectedRole === 'admin') name = 'IT Admin';

      // 600ms: Memuat modul AI
      const t1 = setTimeout(() => {
        setSplashProgress(0.35);
        setSplashStatus('Memuat modul AI (CNN & MLP)...');
      }, 600);

      // 1200ms: Menghubungkan DB
      const t2 = setTimeout(() => {
        setSplashProgress(0.65);
        setSplashStatus('Menghubungkan basis data lokal...');
      }, 1200);

      // 1800ms: Penyelarasan Sinkronisasi
      const t3 = setTimeout(() => {
        setSplashProgress(0.85);
        setSplashStatus('Menyelaraskan data sinkronisasi...');
      }, 1800);

      // 2400ms: Akses disetujui
      const t4 = setTimeout(() => {
        setSplashProgress(1.0);
        setSplashStatus('Akses disetujui. Memuat dasbor...');
      }, 2400);

      // 3000ms: Final login redirection
      const t5 = setTimeout(() => {
        setIsLoggingIn(false);
        login(name, selectedRole);
      }, 3000);

    } catch (e) {
      setIsLoggingIn(false);
      Alert.alert('Error Login', e.message);
      setError(e.message);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        {/* Header Branding (Matched with Home Screen) */}
        <View style={styles.brandContainer}>
          <View style={styles.logoRow}>
            <View style={styles.logoGraphic}>
              <Eye size={40} color="#0EA5E9" style={{ position: 'absolute', top: 2, left: 2 }} />
              <Droplet size={20} color="#EF4444" fill="#EF4444" style={{ position: 'absolute', top: 12, left: 12 }} />
              <Search size={16} color="#1E293B" strokeWidth={2.5} style={{ position: 'absolute', bottom: 2, right: 2 }} />
            </View>
            <View style={styles.logoTextWrapper}>
              <Text style={styles.logoTextMain}>Anemia</Text>
              <Text style={styles.logoTextSub}>Vision</Text>
            </View>
          </View>
          <Text style={styles.appTagline}>Sistem Skrining & Deteksi Dini Anemia Sekolah</Text>
        </View>

        {/* Premium Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Selamat Datang</Text>
          <Text style={styles.cardSubtitle}>Silakan masuk ke portal screening sekolah Anda</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Email Input */}
          <Text style={styles.fieldLabel}>Username / Email</Text>
          <View style={[
            styles.inputContainer, 
            emailFocused && styles.inputContainerFocused
          ]}>
            <User size={18} color={emailFocused ? '#0D9488' : '#94A3B8'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Masukkan username atau email..."
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          {/* Password Input */}
          <Text style={styles.fieldLabel}>Kata Sandi</Text>
          <View style={[
            styles.inputContainer, 
            passwordFocused && styles.inputContainerFocused
          ]}>
            <Lock size={18} color={passwordFocused ? '#0D9488' : '#94A3B8'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Masukkan kata sandi..."
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              {showPassword ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
            </TouchableOpacity>
          </View>

          {/* Role Switcher Segmented Control */}
          <Text style={styles.roleLabel}>Pilih Role Simulasi Akses:</Text>
          <View style={styles.roleContainer}>
            {[
              { id: 'kader', label: 'Kader' },
              { id: 'tbms', label: 'TBMs' },
              { id: 'sekolah', label: 'Sekolah' },
              { id: 'admin', label: 'Admin' }
            ].map((role) => (
              <TouchableOpacity
                key={role.id}
                style={[styles.roleButton, selectedRole === role.id && styles.roleButtonActive]}
                onPress={() => setSelectedRole(role.id)}
                activeOpacity={0.9}
              >
                <Text style={[styles.roleButtonText, selectedRole === role.id && styles.roleButtonTextActive]}>
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Login Button */}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.85}>
            <Shield size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.loginButtonText}>Masuk Sekarang</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Security Notice */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Enkripsi End-to-End Aktif. Kepatuhan UU PDP Indonesia terjamin.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>

    {isLoggingIn && (
      <View style={styles.splashOverlay}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={styles.splashContent}>
          {/* Large Styled Logo */}
          <View style={styles.splashLogoGraphic}>
            <Eye size={96} color="#0EA5E9" style={{ position: 'absolute', top: 0, left: 0 }} />
            <Droplet size={46} color="#EF4444" fill="#EF4444" style={{ position: 'absolute', top: 22, left: 22 }} />
            <Search size={30} color="#F1F5F9" strokeWidth={3} style={{ position: 'absolute', bottom: 0, right: 0 }} />
          </View>
          
          <Text style={styles.splashAppName}>Anemia Vision</Text>
          <Text style={styles.splashTagline}>Sistem Skrining & Deteksi Dini Anemia</Text>

          {/* Loading Indicator */}
          <View style={styles.splashLoadingBox}>
            <ActivityIndicator size="large" color="#0D9488" style={{ marginBottom: 16 }} />
            <Text style={styles.splashLoadingText}>Mempersiapkan dasbor {selectedRole === 'kader' ? 'Maya' : selectedRole.toUpperCase()}...</Text>
          </View>
        </View>
      </View>
    )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoGraphic: {
    width: 48,
    height: 48,
    position: 'relative',
    marginRight: 10,
  },
  logoTextWrapper: {
    justifyContent: 'center',
  },
  logoTextMain: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  logoTextSub: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  appTagline: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 24,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
  },
  inputContainerFocused: {
    borderColor: '#0D9488',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: '#0F172A',
  },
  eyeIcon: {
    padding: 8,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 26,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  roleButtonActive: {
    backgroundColor: '#0D9488',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#0D9488',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  splashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F172A',
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    width: '85%',
    alignItems: 'center',
  },
  splashLogoGraphic: {
    width: 106,
    height: 106,
    position: 'relative',
    marginBottom: 24,
  },
  splashAppName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  splashTagline: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 6,
    marginBottom: 40,
    fontWeight: '500',
  },
  splashLoadingBox: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLoadingText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
