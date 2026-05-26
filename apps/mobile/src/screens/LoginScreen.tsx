import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { apiFetch } from '../lib/api';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', padding: 32 },
  title: { fontSize: 28, fontWeight: '700', color: '#C9961A', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 14, color: '#7A6A58', textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: '#FFF', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 },
  btn: { backgroundColor: '#C9961A', padding: 16, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#0D0D0D', fontWeight: '700', fontSize: 16 },
  error: { color: '#B42318', textAlign: 'center', marginBottom: 16 },
});

export default function LoginScreen({ locale, onLogin }: { locale: 'ar' | 'en'; onLogin: (token: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    try {
      const result: any = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      onLogin(result.accessToken);
    } catch (err: any) { setError(err.message); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Banco Ricco</Text>
      <Text style={styles.sub}>{locale === 'ar' ? 'تسجيل الدخول' : 'Login'}</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.btn} onPress={handleLogin}>
        <Text style={styles.btnText}>{locale === 'ar' ? 'دخول' : 'Login'}</Text>
      </TouchableOpacity>
    </View>
  );
}
