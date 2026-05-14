import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { spacing, typography } from '../../../../constants/colors';
import { useAuth } from '../../../../context/AuthContext';
import { useColors } from '../../../../hooks/useColors';
import { supabase } from '../../../../lib/supabase';
import { useToast } from '../../../../components/ui/Toast';

interface Bank {
  id: number;
  name: string;
  code: string;
}

export default function BankAccountScreen() {
  const colors = useColors();
  const router = useRouter();
  const { restaurant, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState(restaurant?.bank_account_number ?? '');
  const [accountName, setAccountName] = useState(restaurant?.bank_account_name ?? '');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await fetch('https://api.paystack.co/bank', {
        headers: {
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_PAYSTACK_SECRET_KEY}`, // Note: Usually secret key is needed for some Paystack APIs, but public list is often available.
        },
      });
      const data = await res.json();
      if (data.status) {
        setBanks(data.data);
        if (restaurant?.bank_name) {
          const b = data.data.find((item: Bank) => item.name === restaurant.bank_name);
          if (b) setSelectedBank(b);
        }
      }
    } catch (err) {
      console.error('Error fetching banks:', err);
    }
  };

  const resolveAccount = async () => {
   if (accountNumber.length !== 10 || !selectedBank) return;
       setVerifying(true);
       try {
         const res = await supabase.functions.invoke('resolve-bank-account', {
           body: { account_number: accountNumber, bank_code: selectedBank.code },
         });
   
         if (res.error) {
           const message = res.error?.context
             ? await res.error.context.json().then((d: any) => d.error).catch(() => res.error.message)
             : res.error.message;
           console.error('Resolve error detail:', message);
           showToast(message ?? 'Failed to verify account number.', 'error');
           setAccountName('');
           return;
         }
   
         if (res.data?.account_name) {
           setAccountName(res.data.account_name);
         } else {
           setAccountName('');
           showToast('Could not resolve account. Check the number and bank.', 'error');
         }
       } catch (err) {
         console.error('Error resolving account:', err);
         setAccountName('');
         showToast('Failed to verify account number.', 'error');
       } finally {
         setVerifying(false);
       }
     };
   

  useEffect(() => {
    if (accountNumber.length === 10 && selectedBank) {
      resolveAccount();
    }
  }, [accountNumber, selectedBank]);

  const handleSave = async () => {
    if (!restaurant?.id || !selectedBank || !accountNumber || !accountName) {
      showToast('Please fill all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          bank_name: selectedBank.name,
          bank_account_number: accountNumber,
          bank_account_name: accountName,
        })
        .eq('id', restaurant.id);

      if (error) throw error;
      await refreshUser();
      showToast('Bank account updated', 'success');
      router.back();
    } catch (err) {
      showToast('Could not save bank details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredBanks = banks.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[typography.h3, { color: colors.foreground }]}>Bank Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.form}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Set up where you'll receive your earnings.
          </Text>

          <Pressable
            onPress={() => setModalVisible(true)}
            style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[typography.body, { color: selectedBank ? colors.foreground : colors.placeholder }]}>
              {selectedBank ? selectedBank.name : 'Select Bank'}
            </Text>
            <Feather name="chevron-down" size={20} color={colors.textMuted} />
          </Pressable>

          <Input
            label="Account Number"
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="numeric"
            maxLength={10}
            placeholder="0123456789"
          />

          <View style={[styles.nameBox, { backgroundColor: colors.surface }]}>
            <Text style={[typography.caption, { color: colors.textMuted }]}>Account Name</Text>
            {verifying ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
            ) : (
              <Text style={[typography.bodySemiBold, { color: accountName ? colors.foreground : colors.textMuted, marginTop: 4 }]}>
                {accountName || 'Enter account number to verify'}
              </Text>
            )}
          </View>

          <Button
            label="Save Bank Account"
            onPress={handleSave}
            loading={loading}
            disabled={!accountName || verifying}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.h4, { color: colors.foreground }]}>Select Bank</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={colors.foreground} />
              </Pressable>
            </View>
            <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
               <Input
                placeholder="Search bank..."
                value={search}
                onChangeText={setSearch}
                leftIcon={<Feather name="search" size={18} color={colors.textMuted} />}
              />
            </View>
            <FlatList
              data={filteredBanks}
              keyExtractor={(item, idx) => `${item.code}-${idx}`}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedBank(item);
                    setModalVisible(false);
                  }}
                  style={({ pressed }) => [
                    styles.bankItem,
                    { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 }
                  ]}
                >
                  <Text style={[typography.body, { color: colors.foreground }]}>{item.name}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1,paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg },
  form: { gap: spacing.lg },
  selector: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  nameBox: {
    padding: spacing.md,
    borderRadius: 12,
    minHeight: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  bankItem: {
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
});
