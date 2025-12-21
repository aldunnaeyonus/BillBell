import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// FIX: Hardcoded fallback from your original _layout.tsx
const FALLBACK_WEB_CLIENT_ID = "249297362734-q0atl2p733pufsrgb3jl25459i24b92h.apps.googleusercontent.com";

export function configureGoogle() {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || FALLBACK_WEB_CLIENT_ID;
  
  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
    scopes: ["profile", "email"],
    profileImageSize: 120,
  });
}

export async function signInWithAppleTokens() {
  const cred = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL
    ],
  });

  return {
    identity_token: cred.identityToken,
    email: cred.email ?? null,
    name: cred.fullName
      ? [cred.fullName.givenName, cred.fullName.familyName].filter(Boolean).join(" ")
      : null,
  };
}

export async function signInWithGoogleIdToken() {
  // Ensure play services (Android)
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const result = await GoogleSignin.signIn();

  const idToken = result.data?.idToken
  if (!idToken) {
    const tokens = await GoogleSignin.getTokens();
    if (!tokens.idToken) throw new Error("Google Sign-In did not return an idToken");
    return { id_token: tokens.idToken };
  }

  return { id_token: idToken };
}

export async function googleSignOut() {
  try { await GoogleSignin.signOut(); } catch {}
}