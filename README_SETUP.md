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

6) NPM run scripts

7) Task:
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

7) Track Bills. No Subscriptions.
   Master your household finances with the most advanced shared bill tracker on the App Store. Bill Bell combines AI-powered scanning, military-grade encryption, and blazing-fast offline performance.

   Pay once, use forever. No subscriptions. No ads. No data tracking.

   Designed for couples, roommates, and families who demand clarity, privacy, and speed.

   INTELLIGENT AUTOMATION • OCR Bill Scanning: Stop typing. Simply snap a photo of your paper bill, and Bill Bell automatically extracts the amount, due date, and vendor. • Smart Autocomplete: Instantly recognizes popular vendors (Netflix, Chase, Spotify) and auto-fills brand logos for a beautiful, organized list. • Predictive Dates: See at a glance if a bill is "Due Tomorrow," "Due in 3 Days," or "Overdue."

   BUILT FOR HOUSEHOLDS • Unlimited Collaboration: Invite partners or roommates to your group. Changes sync instantly across all devices (Supports Family Sharing). • Offline-First Architecture: No signal? No problem. Add or edit bills while offline; we sync everything securely once you reconnect. • Conflict-Free Management: Ideal for joint accounts, split rent, and shared utilities.

   PREMIUM EXPERIENCE • Interactive Widgets: View upcoming bills and mark them as paid directly from your Home Screen. • Live Activities: Keep track of due dates in real-time on your Lock Screen and Dynamic Island. • Actionable Notifications: Long-press a reminder to "Mark Paid" or "Snooze" instantly. • Tactile Feedback: Enjoy a premium feel with custom Haptic feedback and confetti animations.

   FINANCIAL INSIGHTS • Interactive Charts: Visualize spending with beautiful bar and donut charts. • Category Breakdown: See exactly how much goes to Streaming, Housing, Utilities, and Debt. • Trend Analysis: Track spending history over 6 months to spot trends early.

   PRIVACY & SECURITY • End-to-End Encryption: Your data is encrypted before it leaves your device. Only you hold the keys. • Recovery Kit: Generate a secure PDF Recovery Kit with your private key to ensure you never lose access. • Biometric Lock: Secure the app with Face ID or Touch ID for an extra layer of privacy.

   EFFORTLESS MIGRATION • Bulk Import: Moving from spreadsheets? Upload a CSV to populate your account in seconds. • Search & Filter: Instantly find any bill by name or amount with our high-performance search engine.

   Stop the stress of manual tracking. Download Bill Bell today and experience the fastest, safest way to manage household bills together.

   Privacy Policy: https://dunn-carabali.com/billMVP/?page=privacy