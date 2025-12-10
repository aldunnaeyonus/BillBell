import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

const googleDiscovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

export async function signInWithAppleTokens() {
  const cred = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  return {
    identity_token: cred.identityToken,
    email: cred.email ?? null,
    name: cred.fullName ? [cred.fullName.givenName, cred.fullName.familyName].filter(Boolean).join(" ") : null,
  };
}

export function useGoogleRequest() {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!;
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  return AuthSession.useAuthRequest(
    {
      clientId,
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      scopes: ["openid", "profile", "email"],
      extraParams: { nonce: "nonce" },
    },
    googleDiscovery
  );
}
