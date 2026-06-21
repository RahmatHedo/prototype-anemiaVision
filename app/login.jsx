import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Dimensions, Alert } from 'react-native';
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

  const handleLogin = () => {
    try {
      setError('');
      
      // Log in with the selected role for quick demo simulation
      let name = 'Kak Kader';
      if (selectedRole === 'tbms') name = 'Tim TBM Husada';
      if (selectedRole === 'sekolah') name = 'Kepala SMAN 1';
      if (selectedRole === 'admin') name = 'IT Admin';

      Alert.alert('Simulasi Login', `Mencoba masuk sebagai: ${name} (${selectedRole.toUpperCase()})`);
      login(name, selectedRole);
    } catch (e) {
      Alert.alert('Error Login', e.message);
      setError(e.message);
    }
  };

  return (
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
});
