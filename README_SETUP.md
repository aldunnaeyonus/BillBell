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

7) Bill Bell – Shared Bill & Debt Reminders
   Never miss a bill again — together.

   Bill Bell is the essential shared bill and debt tracker designed for households, couples, and anyone who wants reliable reminders and total visibility into their financial commitments. Say goodbye to late fees and communication gaps with a platform built for shared responsibility.

   RELIABLE BILL REMINDERS
   Stay ahead of every due date with a multi-layered notification system. Bill Bell ensures you are alerted exactly when it matters most:

   Timed Alerts: Receive notifications before a bill is due so you have time to plan.

   Hybrid System: Benefit from local device notifications with a reliable push backup.

   Smart Silence: Reminders automatically stop the moment anyone in your family marks a bill as paid.

   BUILT FOR FAMILIES & HOUSEHOLDS
   Managing a home is a team effort. Bill Bell is built from the ground up to keep everyone on the same page:

   Family Groups: Easily create a "Family" and invite members to join your shared space.

   Real-Time Sync: When a bill is added or updated, everyone stays in sync across all devices automatically.

   Collective Visibility: Ideal for partners, roommates, or caregivers managing household responsibilities.

   NATIVE iOS INTEGRATION
   Bill Bell leverages the latest iOS technology to put your bills front and center without even opening the app:

   Live Activities: Track upcoming due dates directly on your Lock Screen or in the Dynamic Island.

   Home Screen Widgets: View your overdue counts and upcoming bills at a glance with beautiful, localized widgets.

   Interactive Actions: Mark bills as paid directly from your widget for low-friction management.

   SIMPLE & FAST MANAGEMENT
   Quick Entry: Add new bills manually in seconds with a clean, modern interface.

   Clear Categorization: View "Pending" and "Paid" bills separately to see exactly what still needs your attention.

   Easy Editing: Update amounts, creditors, or notes at any time as your bills change.

   SECURE BULK IMPORT
   Moving your data from a spreadsheet or another app? Use our secure import tool:

   Import Codes: Generate a secure, one-time code to link your data.

   CSV Support: Upload a spreadsheet to instantly populate your family account with all your existing bills.

   PRIVACY & SECURITY
   Your financial data is sensitive, and we treat it that way:

   Biometric Security: Securely unlock the app using Face ID or Touch ID.

   Trusted Logins: Sign in quickly and securely with Apple or Google authentication.

   Family Privacy: Your data is protected and only shared with the specific members of your Family group.

   IDEAL FOR:
   Families: Sharing rent, utilities, and household expenses.

   Couples: Managing joint accounts and personal debts in one place.

   Caregivers: Tracking financial responsibilities for loved ones.

   Roommates: Ensuring everyone knows their share of the monthly bills.

   Stop the stress of tracking dates and start managing your bills with clarity. Download Bill Bell today and master your household finances together.