import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform, StatusBar } from 'react-native';
import { useAuth } from '../_layout';
import { getScreenings, syncOfflineData, clearAllData } from '../../utils/storage';
import { User, Cloud, RefreshCw, LogOut, HardDrive, ShieldCheck } from 'lucide-react-native';

export default function ProfilScreen() {
  const { user, logout } = useAuth();
  
  // Storage stats state
  const [localCount, setLocalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const loadStats = async () => {
    const data = await getScreenings();
    const mayaData = data.filter(item => item.id.startsWith('AV-0012'));
    setLocalCount(mayaData.length);
    const pending = mayaData.filter(item => item.syncStatus === 'pending').length;
    setPendingCount(pending);
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    if (pendingCount === 0) {
      Alert.alert('Info', 'Semua data lokal sudah tersinkronisasi.');
      return;
    }

    setSyncing(true);
    setTimeout(async () => {
      try {
        const synced = await syncOfflineData();
        Alert.alert('Sukses', `${synced} data skrining berhasil disinkronkan ke server.`);
        loadStats();
      } catch (e) {
        Alert.alert('Error', 'Gagal menyinkronkan data.');
      } finally {
        setSyncing(false);
      }
    }, 2000); // 2s simulated loading
  };

  const handleClearDb = () => {
    Alert.alert(
      'Hapus Database',
      'Apakah Anda yakin ingin menghapus semua data lokal? Tindakan ini akan mengembalikan data ke kondisi awal (seed data).',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Sukses', 'Database lokal dibersihkan.');
            loadStats();
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile Header */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarOuterCircle}>
          <View style={styles.avatarInnerCircle}>
            <User size={36} color="#0D9488" />
          </View>
        </View>
        <Text style={styles.profileName}>{user?.name || 'Maya'}</Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleTagText}>Siswi AnemiaVision</Text>
        </View>
        <Text style={styles.profileSchool}>{user?.school || 'SMPN X Palembang'}</Text>
      </View>

      {/* Network connection is mandated online */}

      {/* Offline Storage Status widget */}
      <Text style={styles.sectionTitle}>Penyimpanan Riwayat Pemeriksaan</Text>
      <View style={styles.card}>
        {/* Stat 1: local count */}
        <View style={styles.storageRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.statIconBg, { backgroundColor: '#F8FAFC' }]}>
              <HardDrive size={18} color="#64748B" />
            </View>
            <Text style={styles.storageLabel}>Total Riwayat Skrining Saya</Text>
          </View>
          <Text style={styles.storageVal}>{localCount} Kali</Text>
        </View>

        {/* Stat 2: pending sync queue */}
        <View style={styles.storageRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.statIconBg, { backgroundColor: pendingCount > 0 ? '#FEF3C7' : '#F8FAFC' }]}>
              <Cloud size={18} color={pendingCount > 0 ? '#D97706' : '#64748B'} />
            </View>
            <Text style={styles.storageLabel}>Antrean Sinkronisasi Lokal</Text>
          </View>
          <Text style={[styles.storageVal, { color: pendingCount > 0 ? '#D97706' : '#64748B', fontWeight: '700' }]}>
            {pendingCount} Antrean
          </Text>
        </View>

        {/* Action button */}
        <TouchableOpacity 
          style={[styles.syncBtn, pendingCount === 0 && styles.syncBtnDisabled]} 
          onPress={handleSync}
          disabled={syncing}
        >
          <RefreshCw size={16} color="#FFF" style={[styles.syncBtnIcon, syncing && styles.spin]} />
          <Text style={styles.syncBtnText}>
            {syncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Settings / System Actions */}
      <Text style={styles.sectionTitle}>Keamanan Sistem</Text>
      <View style={styles.card}>
        <View style={styles.settingsRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.statIconBg, { backgroundColor: '#F0FDFA' }]}>
              <ShieldCheck size={18} color="#0D9488" />
            </View>
            <Text style={styles.storageLabel}>Enkripsi AES-256 Medis</Text>
          </View>
          <Text style={styles.settingsActive}>Aktif</Text>
        </View>
        
        <TouchableOpacity style={styles.dangerActionBtn} onPress={handleClearDb}>
          <Text style={styles.dangerActionBtnText}>Bersihkan Database Lokal</Text>
        </TouchableOpacity>
      </View>

      {/* Logout button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <LogOut size={16} color="#EF4444" style={{ marginRight: 8 }} />
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
    paddingTop: Platform.OS === 'ios' ? 24 : (StatusBar.currentHeight || 24),
    paddingBottom: 40,
  },
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarOuterCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarInnerCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  roleTag: {
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  roleTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
  profileSchool: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 24,
    marginTop: 24,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 5,
    elevation: 1,
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  networkIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncLabel: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  syncSubLabel: {
    fontSize: 11.5,
    marginTop: 2,
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storageLabel: {
    fontSize: 13.5,
    color: '#475569',
    fontWeight: '600',
    marginLeft: 12,
  },
  storageVal: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  syncBtn: {
    flexDirection: 'row',
    backgroundColor: '#0D9488',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  syncBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  syncBtnIcon: {
    marginRight: 8,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  settingsActive: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700',
  },
  dangerActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
  },
  dangerActionBtnText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
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
