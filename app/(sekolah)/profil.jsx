import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../_layout';
import { User, LogOut, ShieldCheck, Landmark } from 'lucide-react-native';

export default function SekolahProfilScreen() {
  const { user, logout } = useAuth();
  const isITAdmin = user?.role === 'admin';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <User size={40} color="#0D9488" />
        </View>
        <Text style={styles.profileName}>{user?.name || 'Kepala Sekolah'}</Text>
        <Text style={styles.profileRole}>
          {isITAdmin ? 'System IT Administrator' : 'Pihak Manajemen Sekolah'}
        </Text>
        <Text style={styles.profileSchool}>{user?.school || 'SMAN 1 Jakarta'}</Text>
      </View>

      {/* Account Permissions */}
      <Text style={styles.sectionTitle}>Hak Akses Pengguna</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Landmark size={18} color="#64748B" />
          <Text style={styles.label}>Monitor Multi-Sesi Skrining</Text>
          <Text style={styles.activeText}>Aktif</Text>
        </View>
        
        <View style={styles.row}>
          <ShieldCheck size={18} color="#64748B" />
          <Text style={styles.label}>Lihat Detail Siswi Anonim</Text>
          <Text style={styles.activeText}>Aktif</Text>
        </View>

        {isITAdmin && (
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <ShieldCheck size={18} color="#0D9488" />
            <Text style={[styles.label, { color: '#0D9488', fontWeight: 'bold' }]}>Retrain & Fine-Tuning AI</Text>
            <Text style={styles.activeText}>Aktif</Text>
          </View>
        )}
      </View>

      {/* Logout button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <LogOut size={18} color="#EF4444" style={{ marginRight: 8 }} />
        <Text style={styles.logoutBtnText}>Keluar dari Akun</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    paddingTop: 64,
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0D9488',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  profileRole: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D9488',
    marginTop: 4,
  },
  profileSchool: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 24,
    marginTop: 24,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  label: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    marginLeft: 12,
  },
  activeText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: 'bold',
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    marginHorizontal: 20,
    marginTop: 32,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
