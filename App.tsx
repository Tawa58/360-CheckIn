import './global.css';
import React from 'react';
import {StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/context/AuthContext';
import {RootNavigator} from './src/navigation/RootNavigator';

function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0F4C5C" />
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
