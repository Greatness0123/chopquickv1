// Support screen — FAQ and Contact Form
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { spacing, typography } from '../../../constants/colors';
import { useColors } from '../../../hooks/useColors';

const FAQS = [
  { q: 'How do I collect my meal?', a: 'Once you pay, you will get a QR code in "My Orders". Show this to the restaurant staff between 8:00 - 9:30 PM.' },
  { q: 'Can I cancel my order?', a: 'Surplus meals are non-refundable to prevent food waste. Please ensure you can pick up before ordering.' },
  { q: 'Is the food fresh?', a: 'Yes! These are fresh meals prepared today that simply haven’t sold by closing time.' },
];

export default function SupportScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!message.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMessage('');
      Alert.alert('Message Sent', 'Our support team will get back to you within 24 hours.');
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.surface }]}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
          <Text style={[typography.h3, { color: colors.foreground }]}>Support</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={[typography.h4, { color: colors.foreground, marginBottom: spacing.md }]}>Frequently Asked Questions</Text>
          {FAQS.map((faq, i) => (
            <View key={i} style={[styles.faqCard, { backgroundColor: colors.surface }]}>
              <Text style={[typography.bodySemiBold, { color: colors.primary }]}>{faq.q}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>{faq.a}</Text>
            </View>
          ))}
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <Text style={[typography.h4, { color: colors.foreground, marginBottom: spacing.md }]}>Contact Us</Text>
          <View style={[styles.form, { backgroundColor: colors.surface }]}>
            <Input
              label="How can we help?"
              value={message}
              onChangeText={setMessage}
              placeholder="Describe your issue..."
              multiline
              numberOfLines={4}
              style={{ height: 100, textAlignVertical: 'top', paddingTop: 12 }}
            />
            <Button
              label="Send Message"
              onPress={handleSubmit}
              loading={loading}
              size="md"
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>

        {/* Direct contact */}
        <View style={styles.directContact}>
          <Feather name="mail" size={16} color={colors.textMuted} />
          <Text style={[typography.caption, { color: colors.textMuted }]}>support@chopquick.com</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', maxWidth: 800, alignSelf: 'center' },
  scroll: { paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  back: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  section: { padding: spacing.lg },
  faqCard: { padding: spacing.lg, borderRadius: 12, marginBottom: spacing.md },
  form: { padding: spacing.lg, borderRadius: 16, gap: spacing.sm },
  directContact: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.xl },
});
