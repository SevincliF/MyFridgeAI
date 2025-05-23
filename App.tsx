/**
 * MyFridge App
 * @format
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Firebase
import { app } from './firebase/config';
import { getAuth, onAuthStateChanged, FirebaseAuthTypes } from '@react-native-firebase/auth';

// Ekranlar
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';

// Ana navigasyon
import AppNavigator from './navigation/AppNavigator';

// BottomSheet için gerekli provider
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// LogBox uyarılarını sil
LogBox.ignoreLogs([
  "ViewPropTypes will be removed",
  "ColorPropType will be removed",
  "[react-native-gesture-handler]"
]);

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  // Kimlik doğrulama durumu değişikliklerini izleme
  useEffect(() => {
    const auth = getAuth(app!);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });

    // İzleyici kaldır
    return unsubscribe;
  }, [initializing]);

  // Yükleniyor durumu
  if (initializing) {
    return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <StatusBar barStyle="dark-content" />
        </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
              // Kullanıcı oturum açmış - Ana Tab Navigator
              <Stack.Screen name="Main" component={AppNavigator} />
            ) : (
              // Kullanıcı oturum açmamış - Giriş/Kayıt ekranları
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Signup" component={SignupScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
