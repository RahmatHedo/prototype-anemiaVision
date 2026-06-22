import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { LayoutDashboard, Camera, Clock, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TBMsLayout() {
  const insets = useSafeAreaInsets();

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
        name="camera"
        options={{
          title: 'Cek Mata',
          tabBarIcon: ({ color }) => <Camera size={22} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="riwayat"
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ color }) => <Clock size={22} color={color} />,
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
