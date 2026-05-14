import React, { createContext, useCallback, useContext, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Button } from './Button';
import { radius, spacing, typography } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';

interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

interface DialogContextValue {
  showConfirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextValue>({ showConfirm: () => Promise.resolve(false) });

export function useDialog() {
  return useContext(DialogContext);
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const showConfirm = useCallback((opts: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setResolveRef(() => resolve);
      setVisible(true);
    });
  }, []);

  const handleConfirm = () => {
    setVisible(false);
    resolveRef?.(true);
  };

  const handleCancel = () => {
    setVisible(false);
    resolveRef?.(false);
  };

  return (
    <DialogContext.Provider value={{ showConfirm }}>
      {children}
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
        <Pressable style={styles.overlay} onPress={handleCancel}>
          <View
            style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.iconContainer, {
              backgroundColor: options?.destructive ? colors.errorDim : colors.primaryDim
            }]}>
              <Feather
                name={options?.destructive ? 'alert-triangle' : 'info'}
                size={24}
                color={options?.destructive ? colors.error : colors.primary}
              />
            </View>
            <Text style={[typography.h3, { color: colors.foreground }]}>{options?.title}</Text>
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
              {options?.message}
            </Text>
            <View style={styles.buttons}>
              <Pressable
                style={[styles.button, { backgroundColor: colors.elevated }]}
                onPress={handleCancel}
              >
                <Text style={[typography.bodySemiBold, { color: colors.foreground }]}>
                  {options?.cancelText ?? 'Cancel'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.button, { backgroundColor: options?.destructive ? colors.error : colors.primary }]}
                onPress={handleConfirm}
              >
                <Text style={[typography.bodySemiBold, { color: '#FFFFFF' }]}>
                  {options?.confirmText ?? 'Confirm'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </DialogContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});