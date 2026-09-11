const path = require('path');

require('dotenv').config({path: path.resolve(__dirname, '.env')});

module.exports = {
  presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
  plugins: [
    [
      'transform-inline-environment-variables',
      {
        include: [
          'VITE_USE_FIREBASE_EMULATOR',
          'VITE_FIREBASE_API_KEY',
          'VITE_FIREBASE_AUTH_DOMAIN',
          'VITE_FIREBASE_PROJECT_ID',
          'VITE_FIREBASE_STORAGE_BUCKET',
          'VITE_FIREBASE_MESSAGING_SENDER_ID',
          'VITE_FIREBASE_APP_ID',
          'VITE_FIREBASE_MEASUREMENT_ID',
          'VITE_GEOFENCE_ID',
          'VITE_GEOFENCE_NAME',
          'VITE_GEOFENCE_LAT',
          'VITE_GEOFENCE_LNG',
          'VITE_GEOFENCE_RADIUS',
        ],
      },
    ],
    'react-native-worklets/plugin',
  ],
};
