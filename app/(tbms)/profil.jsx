import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../_layout';
import { getHbInputs, syncOfflineData, clearAllData } from '../../utils/storage';
import { User, Cloud, RefreshCw, LogOut, HardDrive, ShieldCheck, Beaker } from 'lucide-react-native';

export default function TbmProfilScreen() {
  const { user, logout } = useAuth();
  
  // Storage stats state
  const [localCount, setLocalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const loadStats = async () => {
    const data = await getHbInputs();
    setLocalCount(data.length);
    const pending = data.filter(item => item.syncStatus === 'pending').length;
    setPendingCount(pending);
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    if (pendingCount === 0) {
      Alert.alert('Info', 'Semua data Hb lokal sudah tersinkronisasi.');
      return;
    }

    setSyncing(true);
    setTimeout(async () => {
      try {
        await syncOfflineData();
        Alert.alert('Sukses', 'Semua data hasil Hb laboratorium berhasil disinkronkan ke server.');
        loadStats();
      } catch (e) {
        Alert.alert('Error', 'Gagal menyinkronkan data.');
      } finally {
        setSyncing(false);
      }
    }, 2000); // 2s simulated loading
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Beaker size={40} color="#0D9488" />
        </View>
        <Text style={styles.profileName}>{user?.name || 'Petugas TBM Husada'}</Text>
        <Text style={styles.profileRole}>Tim Medis / Penilai Gold Standard</Text>
        <Text style={styles.profileSchool}>Laboratorium Cabang Jakarta</Text>
      </View>

      {/* Network connection is mandated online */}

      {/* Offline Storage Status widget */}
      <Text style={styles.sectionTitle}>Penyimpanan Lab & Sinkronisasi</Text>
      <View style={styles.syncCard}>
        {/* Stat 1: local count */}
        <View style={styles.storageRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <HardDrive size={18} color="#64748B" />
            <Text style={styles.storageLabel}>Total Data Hb di HP</Text>
          </View>
          <Text style={styles.storageVal}>{localCount} Catatan</Text>
        </View>

        {/* Stat 2: pending sync queue */}
        <View style={styles.storageRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Cloud size={18} color="#EAB308" />
            <Text style={styles.storageLabel}>Antrean Belum Terunggah</Text>
          </View>
          <Text style={[styles.storageVal, { color: pendingCount > 0 ? '#EAB308' : '#64748B', fontWeight: '700' }]}>
            {pendingCount} Catatan
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
  syncCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  syncSubLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  storageLabel: {
    fontSize: 13,
    color: '#475569',
    marginLeft: 10,
  },
  storageVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  syncBtn: {
    flexDirection: 'row',
    backgroundColor: '#0D9488',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  syncBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  syncBtnIcon: {
    marginRight: 8,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
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
