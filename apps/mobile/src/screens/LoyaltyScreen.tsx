import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiFetch } from '../lib/api';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F3E7', padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardRow: { flexDirection: 'row', gap: 12 },
  halfCard: { flex: 1 },
  bigNum: { fontSize: 48, fontWeight: '700', color: '#C9961A' },
  bigNumDark: { fontSize: 48, fontWeight: '700', color: '#6B4F3A' },
  label: { fontSize: 14, color: '#7A6A58', marginTop: 4, marginBottom: 8 },
  bar: { height: 12, backgroundColor: '#E8E0D4', borderRadius: 6, overflow: 'hidden', width: '100%', marginBottom: 4 },
  barFill: { height: '100%', backgroundColor: '#C9961A', borderRadius: 6 },
  barText: { fontSize: 12, color: '#7A6A58' },
  btn: { backgroundColor: '#C9961A', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginTop: 12 },
  btnText: { color: '#0D0D0D', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#D4C9B8', borderRadius: 8, padding: 10, marginBottom: 8, backgroundColor: '#fff', width: 80, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  qrBox: { padding: 24, borderWidth: 2, borderColor: '#D4C9B8', borderRadius: 12, borderStyle: 'dashed', marginBottom: 12 },
  qrText: { fontFamily: 'monospace', fontSize: 14, color: '#7A6A58' },
  table: { width: '100%' },
  tableHeader: { fontSize: 13, fontWeight: '600', color: '#7A6A58', marginBottom: 8 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0EBE1' },
  cell: { fontSize: 13 },
  goldText: { color: '#C9961A' },
  mutedText: { color: '#7A6A58' },
  successBox: { backgroundColor: '#D4EDDA', padding: 12, borderRadius: 8, marginBottom: 16 },
  successText: { color: '#155724' },
});

export default function LoyaltyScreen({ locale, token, onLogin }: { locale: 'ar' | 'en'; token: string | null; onLogin?: (token: string) => void }) {
  const navigation = useNavigation<any>();
  const [data, setData] = useState<any>(null);
  const [qr, setQr] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redeemPts, setRedeemPts] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      apiFetch<any>('/loyalty/my', { token }),
      apiFetch<any>('/loyalty/qr', { token }),
    ]).then(([d, q]) => {
      setData(d);
      setQr(q);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const handleRedeemStamp = async () => {
    try {
      await apiFetch('/loyalty/redeem-stamp', { method: 'POST', body: JSON.stringify({}), token });
      setMsg(locale === 'ar' ? 'تم بنجاح!' : 'Success!');
      load();
    } catch (err: any) { alert(err.message); }
  };

  const handleRedeemPoints = async () => {
    const pts = parseInt(redeemPts);
    if (!pts || pts < 1) return;
    try {
      await apiFetch('/loyalty/redeem-points', { method: 'POST', body: JSON.stringify({ points: pts }), token });
      setMsg(locale === 'ar' ? 'تم بنجاح!' : 'Success!');
      setRedeemPts('');
      load();
    } catch (err: any) { alert(err.message); }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      EARN: locale === 'ar' ? 'مكتسب' : 'Earned',
      REDEEM: locale === 'ar' ? 'مستبدل' : 'Redeemed',
      STAMP: locale === 'ar' ? 'طابع' : 'Stamp',
      STAMP_REDEEM: locale === 'ar' ? 'استبدال طوابع' : 'Stamps Redeemed',
    };
    return map[type] || type;
  };

  if (loading) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color="#C9961A" /></View>;

  if (!token) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🪙</Text>
        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8, color: '#0D0D0D' }}>
          {locale === 'ar' ? 'B.R Coins' : 'B.R Coins'}
        </Text>
        <Text style={{ color: '#7A6A58', textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 }}>
          {locale === 'ar' ? 'سجل الدخول لجمع النقاط والطوابع مع كل طلب' : 'Login to collect coins and stamps with every order'}
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.btnText}>{locale === 'ar' ? 'تسجيل الدخول' : 'Login'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><Text>{locale === 'ar' ? 'لا توجد بيانات' : 'No data'}</Text></View>;

  const progress = Math.min(data.stampCount / data.stampTarget * 100, 100);

  return (
    <ScrollView style={styles.container}>
      {msg ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{msg}</Text>
        </View>
      ) : null}

      <View style={styles.cardRow}>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.bigNum}>{data.stampCount}</Text>
          <Text style={styles.label}>{locale === 'ar' ? 'الطوابع' : 'Stamps'}</Text>
          <View style={styles.bar}><View style={[styles.barFill, { width: `${progress}%` }]} /></View>
          <Text style={styles.barText}>{data.stampCount}/{data.stampTarget}</Text>
          {data.stampCount >= data.stampTarget && (
            <TouchableOpacity style={styles.btn} onPress={handleRedeemStamp}>
              <Text style={styles.btnText}>{locale === 'ar' ? 'استبدل بمشروب مجاني' : 'Redeem Free Drink'}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.bigNumDark}>{data.balance}</Text>
          <Text style={styles.label}>{locale === 'ar' ? 'النقاط' : 'Points'}</Text>
          <View style={styles.row}>
            <TextInput style={styles.input} keyboardType="numeric" value={redeemPts} onChangeText={setRedeemPts} placeholder="0" />
            <TouchableOpacity style={[styles.btn, { paddingHorizontal: 16 }]} onPress={handleRedeemPoints}>
              <Text style={styles.btnText}>{locale === 'ar' ? 'استبدل' : 'Redeem'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>{locale === 'ar' ? 'بطاقة QR' : 'QR Card'}</Text>
        <View style={styles.qrBox}>
          <Text style={styles.qrText}>{qr?.publicToken || '---'}</Text>
        </View>
        <Text style={[styles.label, { textAlign: 'center' }]}>{locale === 'ar' ? 'استخدم هذا الرمز في المتجر لكسب الطوابع' : 'Show this code in-store to earn stamps'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>{locale === 'ar' ? 'سجل المعاملات' : 'Transactions'}</Text>
        {data.transactions.length === 0 ? (
          <Text style={styles.mutedText}>{locale === 'ar' ? 'لا توجد معاملات بعد' : 'No transactions yet'}</Text>
        ) : (
          data.transactions.slice(0, 10).map((t: any) => (
            <View key={t.id} style={styles.tableRow}>
              <Text style={styles.cell}>{new Date(t.createdAt).toLocaleDateString()}</Text>
              <Text style={styles.cell}>{getTypeLabel(t.type)}</Text>
              <Text style={[styles.cell, t.points > 0 ? styles.goldText : styles.mutedText]}>{t.points > 0 ? `+${t.points}` : t.points}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
