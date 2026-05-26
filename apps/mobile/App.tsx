import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import CartScreen from './src/screens/CartScreen';
import LoginScreen from './src/screens/LoginScreen';
import LoyaltyScreen from './src/screens/LoyaltyScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [locale, setLocale] = useState<'ar' | 'en'>('ar');
  const [token, setToken] = useState<string | null>(null);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {!token ? (
        <LoginScreen locale={locale} onLogin={setToken} />
      ) : (
        <Stack.Navigator screenOptions={{
          headerStyle: { backgroundColor: '#0D0D0D' },
          headerTintColor: '#C9961A',
          headerTitleStyle: { fontWeight: '700' },
        }}>
          <Stack.Screen name="Home" options={{ title: 'Banco Ricco' }}>
            {props => <HomeScreen {...props} locale={locale} />}
          </Stack.Screen>
          <Stack.Screen name="Products" options={{ title: locale === 'ar' ? 'المنتجات' : 'Products' }}>
            {props => <ProductsScreen {...props} locale={locale} />}
          </Stack.Screen>
          <Stack.Screen name="Cart" options={{ title: locale === 'ar' ? 'السلة' : 'Cart' }}>
            {props => <CartScreen {...props} locale={locale} token={token} />}
          </Stack.Screen>
          <Stack.Screen name="Loyalty" options={{ title: locale === 'ar' ? 'الولاء' : 'Loyalty' }}>
            {props => <LoyaltyScreen {...props} locale={locale} token={token} />}
          </Stack.Screen>
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
