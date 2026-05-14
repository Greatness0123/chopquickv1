// Root redirect — sends user to correct flow based on auth state
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';

export default function RootIndex() {
  const { isAuthenticated, isLoading, userRole } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#141218' }}>
        <ActivityIndicator color="#E8480F" size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (userRole === 'restaurant_owner') {
    return <Redirect href="/(restaurant)/dashboard" />;
  }

  return <Redirect href="/(customer)/explore" />;
}
