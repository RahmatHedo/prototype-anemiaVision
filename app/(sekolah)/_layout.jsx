import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { LayoutDashboard, Users, AlertTriangle, Settings, User } from 'lucide-react-native';
import { useAuth } from '../_layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getScreenings } from '../../utils/storage';

export default function SekolahLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const insets = useSafeAreaInsets();
  const [badgeCount, setBadgeCount] = useState(null);

  useEffect(() => {
    const fetchBadge = async () => {
      try {
        const data = await getScreenings();
        const count = data.filter(item => (item.tbmResult || item.result) === 'Berat').length;
        setBadgeCount(count > 0 ? count : null);
      } catch (e) {
        console.error('Error fetching badge count:', e);
      }
    };
    fetchBadge();
    const interval = setInterval(fetchBadge, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0D9488',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: [
          styles.tabBar,
          {
            height: Platform.OS === 'ios' 
              ? (insets.bottom > 0 ? 64 + insets.bottom : 76) 
              : (insets.bottom > 0 ? 64 + insets.bottom : 72),
            paddingBottom: Platform.OS === 'ios'
              ? (insets.bottom > 0 ? insets.bottom - 4 : 12)
              : (insets.bottom > 0 ? insets.bottom : 12),
          }
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="riwayat"
        options={{
          title: 'Riwayat Siswi',
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="prioritas"
        options={{
          title: 'Prioritas',
          tabBarIcon: ({ color }) => <AlertTriangle size={22} color={color} />,
          tabBarBadge: badgeCount,
          tabBarBadgeStyle: { backgroundColor: '#EF4444', color: '#FFF' },
        }}
      />
      
      {/* Conditionally show admin panel to Admin role, hide for Sekolah */}
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin Panel',
          href: isAdmin ? undefined : null, // Hides tab from bar if not admin
          tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  }
});
