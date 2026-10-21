import React from 'react';
import { StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from './Brand';
import { s } from '../app/globals';

export function ConfigurationPage() {
  return <SafeAreaView style={s.safe}>
    <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
    <View style={s.content}><Logo size={64} />
      <Text style={s.pageTitle}>Configura la conexión del API</Text>
      <Text accessibilityRole="alert" style={s.errorText}>
        Define EXPO_PUBLIC_API_URL con una URL base válida en .env.local y reinicia Expo.
      </Text>
    </View>
  </SafeAreaView>;
}
