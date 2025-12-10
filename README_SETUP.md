# Frontend setup (Expo)

This folder contains the screens + theme system. You still need to initialize the Expo project here.

From `frontend/`:

1) Create Expo app in place:
   npx create-expo-app .

2) Install deps:
   npx expo install expo-router expo-secure-store expo-notifications expo-device
   npx expo install expo-apple-authentication
   npx expo install expo-auth-session expo-web-browser
   npx expo install @react-native-async-storage/async-storage

3) Set env:
   EXPO_PUBLIC_API_URL=http://localhost:8000
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

4) Run:
   npx expo start
