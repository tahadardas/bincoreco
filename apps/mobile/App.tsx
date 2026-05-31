import React, { useState, useCallback, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import HomeScreen from './src/screens/HomeScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import LoginScreen from './src/screens/LoginScreen';
import LoyaltyScreen from './src/screens/LoyaltyScreen';

function HeaderRight({ locale, token, onLogout, onToggleLocale, onLoginNav }: {
  locale: 'ar' | 'en'; token: string | null; onLogout: () => void;
  onToggleLocale: () => void; onLoginNav: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 0 }}>
      <TouchableOpacity onPress={onToggleLocale} style={{ paddingHorizontal: 8 }}>
        <Text style={{ color: '#C9961A', fontSize: 14 }}>{locale === 'ar' ? 'EN' : 'AR'}</Text>
      </TouchableOpacity>
      {token ? (
        <TouchableOpacity onPress={onLogout} style={{ paddingHorizontal: 8 }}>
          <Text style={{ color: '#C9961A', fontSize: 14 }}>{locale === 'ar' ? 'خروج' : 'Logout'}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={onLoginNav} style={{ paddingHorizontal: 8 }}>
          <Text style={{ color: '#C9961A', fontSize: 14 }}>{locale === 'ar' ? 'دخول' : 'Login'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const Stack = createNativeStackNavigator();
const TOKEN_KEY = '@br_token';

export default function App() {
  const [locale, setLocale] = useState<'ar' | 'en'>('ar');
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY).then(stored => {
      if (stored) setToken(stored);
      else setToken(null);
    }).catch(() => setToken(null)).finally(() => setLoading(false));
  }, []);

  const handleLogin = useCallback(async (newToken: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    setToken(newToken);
  }, []);

  const handleLogout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(prev => prev === 'ar' ? 'en' : 'ar');
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#C9961A" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{
        headerStyle: { backgroundColor: '#0D0D0D' },
        headerTintColor: '#C9961A',
        headerTitleStyle: { fontWeight: '700' },
      }}>
        <Stack.Screen name="Home" options={({ navigation }) => ({ title: 'Banco Ricco', headerRight: () => (
          <HeaderRight locale={locale} token={token} onLogout={handleLogout}
            onToggleLocale={toggleLocale} onLoginNav={() => navigation.navigate('Login')} />
        )})}>
          {props => <HomeScreen {...props} locale={locale} />}
        </Stack.Screen>
        <Stack.Screen name="Login" options={{ title: locale === 'ar' ? 'تسجيل الدخول' : 'Login' }}>
          {props => <LoginScreen {...props} locale={locale} onLogin={(t) => { handleLogin(t); props.navigation.goBack(); }} />}
        </Stack.Screen>
        <Stack.Screen name="Products" options={{ title: locale === 'ar' ? 'المنتجات' : 'Products' }}>
          {props => <ProductsScreen {...props} locale={locale} />}
        </Stack.Screen>
        <Stack.Screen name="ProductDetail" options={{ title: locale === 'ar' ? 'تفاصيل المنتج' : 'Product Details' }}>
          {props => <ProductDetailScreen {...props} locale={locale} token={token} />}
        </Stack.Screen>
        <Stack.Screen name="Cart" options={{ title: locale === 'ar' ? 'السلة' : 'Cart' }}>
          {props => <CartScreen {...props} locale={locale} token={token} onLogin={(t) => { handleLogin(t); props.navigation.goBack(); }} />}
        </Stack.Screen>
        <Stack.Screen name="Loyalty" options={{ title: locale === 'ar' ? 'الولاء' : 'Loyalty' }}>
          {props => <LoyaltyScreen {...props} locale={locale} token={token} onLogin={(t) => { handleLogin(t); props.navigation.goBack(); }} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
