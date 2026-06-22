import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { Home, Clock, Eye, Bell, User } from 'lucide-react-native';
import { getScreenings } from '../../utils/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function KaderLayout() {
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const insets = useSafeAreaInsets();

  // Poll for severe screenings count to show badge
  useEffect(() => {
    const checkAlerts = async () => {
      const data = await getScreenings();
      // Count cases where result is 'Berat' (Critical Triage)
      const severeCount = data.filter(item => item.result === 'Berat').length;
      setUnreadAlerts(severeCount);
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 5000); // Check every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#38BDF8', // Cyan/sky blue active color
        tabBarInactiveTintColor: '#94A3B8', // Slate gray inactive color
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
          title: 'Beranda',
          tabBarIcon: ({ color, size }) => <Home size={22} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="riwayat"
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ color, size }) => <Clock size={22} color={color} />,
        }}
      />
      
      {/* Floating Center Eye Action Button */}
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Cek Mata',
          tabBarIcon: ({ focused }) => (
            <View style={styles.floatingIconContainer}>
              <Eye size={28} color={focused ? '#38BDF8' : '#FFFFFF'} strokeWidth={2.2} />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="prioritas"
        options={{
          title: 'Prioritas',
          tabBarBadge: unreadAlerts > 0 ? unreadAlerts : undefined,
          tabBarBadgeStyle: styles.badge,
          tabBarIcon: ({ color, size }) => <Bell size={22} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: 8,
    backgroundColor: '#1E293B', // Dark navy background
    borderTopWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  floatingIconContainer: {
    position: 'absolute',
    top: -24, // Overlap above the tab bar
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E293B', // Matches the tab bar color
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#F8F9FA', // Border color matches the screen background
  },
  badge: {
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
