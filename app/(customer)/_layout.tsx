// Customer bottom tab layout — explore, orders, wallet, profile
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Redirect, Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { WebLayout } from '../../components/WebLayout';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="explore/index">
        <Icon sf={{ default: 'fork.knife', selected: 'fork.knife' }} />
        <Label>explore</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="orders/index">
        <Icon sf={{ default: 'bag', selected: 'bag.fill' }} />
        <Label>orders</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="wallet/index">
        <Icon sf={{ default: 'creditcard', selected: 'creditcard.fill' }} />
        <Label>Wallet</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile/index">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 84 : undefined,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={95} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="explore/index"
        options={{
          title: 'explore',
          tabBarIcon: ({ color }) =>
            Platform.OS === 'ios' ? (
              <SymbolView name="fork.knife" tintColor={color} size={22} />
            ) : (
              <Feather name="compass" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="orders/index"
        options={{
          title: 'orders',
          tabBarIcon: ({ color }) =>
            Platform.OS === 'ios' ? (
              <SymbolView name="bag" tintColor={color} size={22} />
            ) : (
              <Feather name="shopping-bag" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="wallet/index"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color }) =>
            Platform.OS === 'ios' ? (
              <SymbolView name="creditcard" tintColor={color} size={22} />
            ) : (
              <Feather name="credit-card" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) =>
            Platform.OS === 'ios' ? (
              <SymbolView name="person" tintColor={color} size={22} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
      {/* Hidden sceens */}
      <Tabs.Screen name="explore/[listingId]" options={{ href: null }} />
      <Tabs.Screen name="orders/[orderId]" options={{ href: null }} />
      <Tabs.Screen name="wallet/add-funds" options={{ href: null }} />
      <Tabs.Screen name="wallet/history" options={{ href: null }} />
      <Tabs.Screen name="wallet/transfer/index" options={{ href: null }} />
      <Tabs.Screen name="profile/edit/index" options={{ href: null }} />
      <Tabs.Screen name="profile/bank-account/index" options={{ href: null }} />
      <Tabs.Screen name="profile/impact" options={{ href: null }} />
      <Tabs.Screen name="profile/saved" options={{ href: null }} />
      <Tabs.Screen name="support/index" options={{ href: null }} />
      <Tabs.Screen name="addresses/index" options={{ href: null }} />
    </Tabs>
  );
}

export default function CustomerLayout() {
  const { userRole, isLoading } = useAuth();

  if (isLoading) return null;

  if (userRole === 'restaurant_owner') {
    return <Redirect href="/(restaurant)/dashboard" />;
  }

  const Layout = isLiquidGlassAvailable() ? NativeTabLayout : ClassicTabLayout;

  return (
    <WebLayout>
      <Layout />
    </WebLayout>
  );
}
