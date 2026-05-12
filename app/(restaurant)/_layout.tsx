// Restaurant tab layout — dashboard, listings, verify, reports, settings
import { Feather } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { WebLayout } from '@/components/WebLayout';

export default function RestaurantLayout() {
  const { userRole, isLoading } = useAuth();
  const colors = useColors();

  if (isLoading) return null;

  if (userRole !== 'restaurant_owner') {
    return <Redirect href="/(customer)/explore" />;
  }

  const isIOS = Platform.OS === 'ios';

  return (
    <WebLayout>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
        },
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} />
        ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Inter_u00Medium',
          marginBottom: isIOS ? 0 : 4,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Feather name="bar-chart-2" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="listings/index"
        options={{
          title: 'Listings',
          tabBarIcon: ({ color }) => <Feather name="list" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="verify/index"
        options={{
          title: 'Verify',
          tabBarIcon: ({ color }) => <Feather name="camera" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports/index"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }) => <Feather name="trending-up" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Feather name="settings" size={22} color={color} />,
        }}
      />
        {/* Hidden screens not shown in tab bar */}
        <Tabs.Screen name="listings/new" options={{ href: null }} />
        <Tabs.Screen name="withdraw/index" options={{ href: null }} />
      </Tabs>
    </WebLayout>
  );
}

const styles = StyleSheet.create({});
