import React, { createContext, useContext, useState, useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// 1. Auth Context Creation
const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

export default function RootLayout() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial simulated user session if exists
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const login = (username, role) => {
    setUser({
      name: role === 'kader' ? 'Maya' : (username || 'Kader AnemiaVision'),
      role: role || 'kader', // 'kader', 'tbms', 'sekolah', 'admin'
      school: 'SMPN X Palembang'
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={{ user, login, logout, isLoading }}>
        <RootLayoutNav />
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  console.log('RootLayoutNav - User:', user ? user.role : 'Guest', 'Segments:', segments);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(kader)' || segments[0] === '(tbms)' || segments[0] === '(sekolah)';
    const onLoginPage = segments[0] === 'login';
    const onWelcomePage = !segments[0] || segments[0] === 'index';

    if (!user) {
      // Redirect to login if not authenticated and trying to access app screens (auth group)
      // or other screens that are not login and not welcome page
      if (inAuthGroup || (!onLoginPage && !onWelcomePage)) {
        router.replace('/login');
      }
    } else {
      // Redirect authenticated user to their role-specific layout if they try to access login or base route
      if (onLoginPage || onWelcomePage) {
        const role = user.role;
        if (role === 'kader') {
          router.replace('/(kader)');
        } else if (role === 'tbms') {
          router.replace('/(tbms)');
        } else {
          router.replace('/(sekolah)');
        }
      }
    }
  }, [user, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  return <Slot />;
}
