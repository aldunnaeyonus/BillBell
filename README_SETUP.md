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

5) Notes:
   Note: Adding Libraries, with the widget causes POD to crash, delete IOS filer, copy BillBellWidget and recreate the widgert.

6) Task:
   Review the entire repository and analyze all TypeScript and JavaScript files.

   Goals:
   Identify any memory leaks, bugs, incorrect logic, or improper programming practices.
   Detect issues that could cause the application to malfunction, crash, or behave unpredictably.
   Point out performance, stability, or maintainability problems.

   For each issue found:
   Explain what the problem is and why it occurs.
   Propose a clear improvement or fix.
   Provide the full, updated source code of the affected file, not just a snippet, reflecting the suggested improvement.

   Output requirements:
   Use clear section headings per file.
   Ensure the revised code is complete, valid, and ready to replace the original file.