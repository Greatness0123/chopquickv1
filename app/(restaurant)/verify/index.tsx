// QR scanner — verify and mark orders as collected
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { spacing, typography } from '@/constants/colors';
import { useColors } from '@/hooks/useColors';
import type { Order } from '@/types';
import { supabase } from '@/lib/supabase';

function formatNGN(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

export default function VerifyScreen() {
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(Platform.OS === 'web');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [confirming, setConfirming] = useState(false);

  const lookupOrder = async (code: string) => {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*, listing:listings(*)')
        .or(`collection_code.eq.${code.trim().toUpperCase()},qr_payload.eq.${code.trim()},id.eq.${code.trim()}`)
        .single();

      if (error || !order) {
        Alert.alert('Not Found', 'An order with this code does not exist. Check the code and try again.');
        return;
      }

      setFoundOrder(order);
    } catch (err) {
      Alert.alert('Error', 'Could not fetch order details');
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    lookupOrder(data);
  };

  const handleMarkCollected = async () => {
    if (!foundOrder) return;
    setConfirming(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          order_status: 'collected',
          collected_at: new Date().toISOString()
        })
        .eq('id', foundOrder.id);

      if (error) throw error;

      // Update restaurant stats (simulated for now, usually handled by triggers)
      await supabase.rpc('increment_restaurant_stats', {
        rest_id: foundOrder.restaurant_id,
        revenue: foundOrder.total_amount
      });

      Alert.alert('Success!', 'Order marked as collected. ₦' + foundOrder.total_amount.toLocaleString('en-NG') + ' added to your earnings.');

      setFoundOrder(null);
      setScanned(false);
      setManualCode('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update order status');
    } finally {
      setConfirming(false);
    }
  };

  const reset = () => {
    setFoundOrder(null);
    setScanned(false);
    setManualCode('');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.foreground }]}>Verify order</Text>
        <Pressable
          onPress={() => setShowManual((v) => !v)}
          style={[styles.toggleBtn, { backgroundColor: colors.elevated }]}
        >
          <Feather name={showManual ? 'camera' : 'edit-3'} size={16} color={colors.foreground} />
          <Text style={[typography.captionMedium, { color: colors.foreground }]}>
            {showManual ? 'Scan QR' : 'Manual'}
          </Text>
        </Pressable>
      </View>

      {!showManual && Platform.OS !== 'web' ? (
        /* Camera view */
        <View style={styles.cameraContainer}>
          {!permission?.granted ? (
            <View style={styles.permBox}>
              <Feather name="camera-off" size={48} color={colors.textMuted} />
              <Text style={[typography.h4, { color: colors.foreground, textAlign: 'center' }]}>
                Camera Permission Needed
              </Text>
              <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
                allow camera access to scan pickup QR codes
              </Text>
              <Button label="Grant Camera access" onPress={requestPermission} fullWidth={false} />
            </View>
          ) : (
            <>
              <CameraView
                style={StyleSheet.absoluteFill}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              />
              {/* Viewfinder overlay */}
              <View style={styles.overlay}>
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
                  <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
                  <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
                  <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
                </View>
                <Text style={[typography.bodyMedium, styles.scanHint, { color: '#FFFFFF' }]}>
                  Point camera at customer's QR code
                </Text>
              </View>
              {scanned && (
                <Pressable
                  onPress={reset}
                  style={[styles.rescanBtn, { backgroundColor: colors.elevated }]}
                >
                  <Text style={[typography.bodyMedium, { color: colors.foreground }]}>Scan again</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      ) : (
        /* Manual code entry */
        <View style={styles.manualContainer}>
          <View style={[styles.manualCard, { backgroundColor: colors.surface }]}>
            <Feather name="hash" size={32} color={colors.primary} />
            <Text style={[typography.h2, { color: colors.foreground }]}>Enter Collection Code</Text>
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
              Ask the customer for their 5-digit pickup code
            </Text>
            <TextInput
              value={manualCode}
              onChangeText={(t) => setManualCode(t.toUpperCase())}
              placeholder="CQ-12345"
              placeholderTextColor={colors.placeholder}
              style={[
                styles.codeInput,
                {
                  backgroundColor: colors.elevated,
                  color: colors.foreground,
                  borderColor: colors.border,
                  ...typography.h3,
                },
              ]}
              autoCapitalize="characters"
              maxLength={8}
            />
            <Button
              label="Lookup order"
              onPress={() => lookupOrder(manualCode)}
              disabled={manualCode.length < 3}
            />
          </View>
        </View>
      )}

      {/* order confirmation modal */}
      <Modal visible={!!foundOrder} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.successIcon, { backgroundColor: colors.successDim }]}>
              <Feather name="check-circle" size={32} color={colors.success} />
            </View>
            <Text style={[typography.h3, { color: colors.foreground }]}>Order Found</Text>

            {foundOrder && (
              <View style={[styles.orderDetails, { backgroundColor: colors.elevated }]}>
                <DetailRow label="Code" value={foundOrder.collection_code ?? '—'} colors={colors} />
                <DetailRow label="item" value={foundOrder.listing?.food_name ?? '—'} colors={colors} />
                <DetailRow label="Qta" value={`×${foundOrder.quantity}`} colors={colors} />
                <DetailRow
                  label="amount"
                  value={formatNGN(foundOrder.total_amount)}
                  colors={colors}
                  highlight
                />
                <DetailRow
                  label="Status"
                  value={foundOrder.order_status}
                  colors={colors}
                />
              </View>
            )}

            <View style={styles.modalActions}>
              <Button label="Cancel" onPress={reset} variant="secondary" fullWidth={false} style={{ flex: 1 }} />
              <Button
                label="Mark Collected"
                onPress={handleMarkCollected}
                loading={confirming}
                fullWidth={false}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  colors,
  highlight,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof import('@/hooks/useColors').useColors>;
  highlight?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[typography.bodyMedium, { color: highlight ? colors.success : colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

const CORNER = 24;
const BORDER = 3;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 10,
  },
  cameraContainer: { flex: 1, position: 'relative' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  scanFrame: {
    width: 240,
    height: 240,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderWidth: BORDER,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  scanHint: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    overflow: 'hidden',
  },
  rescanBtn: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  permBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xxl,
  },
  manualContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  manualCard: {
    width: '100%',
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  codeInput: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: spacing.lg,
    textAlign: 'center',
    letterSpacing: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    gap: spacing.lg,
    alignItems: 'center',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderDetails: {
    width: '100%',
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
});
