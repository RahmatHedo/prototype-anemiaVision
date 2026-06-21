import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { LayoutDashboard, Users, AlertTriangle, Settings, User } from 'lucide-react-native';
import { useAuth } from '../_layout';

export default function SekolahLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0D9488',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: styles.tabBar,
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
    height: Platform.OS === 'ios' ? 90 : 72,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
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
