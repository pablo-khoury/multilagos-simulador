import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export interface CustomFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  oAuthClientId?: string;
}

export interface FirebaseErrorInfo {
  title: string;
  message: string;
  code: string;
  isConfigIssue: boolean;
}

const STORAGE_KEY_TOKEN = 'multilagos_google_workspace_token';
const STORAGE_KEY_TIME = 'multilagos_google_token_time';
const STORAGE_KEY_USER = 'multilagos_google_user';
const STORAGE_KEY_CUSTOM_CONFIG = 'multilagos_custom_firebase_config';

/**
 * Returns effective Firebase configuration following precedence:
 * 1. Custom config in localStorage (configured via Admin Panel)
 * 2. Environment variables (VITE_FIREBASE_*)
 * 3. Default fallback from firebase-applet-config.json
 */
export const getEffectiveFirebaseConfig = (): CustomFirebaseConfig => {
  // 1. Check localStorage for consultant/admin override
  try {
    const custom = localStorage.getItem(STORAGE_KEY_CUSTOM_CONFIG);
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed.apiKey && parsed.projectId) {
        return {
          apiKey: String(parsed.apiKey).trim(),
          authDomain: String(parsed.authDomain || `${parsed.projectId}.firebaseapp.com`).trim(),
          projectId: String(parsed.projectId).trim(),
          storageBucket: String(parsed.storageBucket || `${parsed.projectId}.appspot.com`).trim(),
          messagingSenderId: String(parsed.messagingSenderId || '').trim(),
          appId: String(parsed.appId || '').trim(),
          oAuthClientId: String(parsed.oAuthClientId || '').trim(),
        };
      }
    }
  } catch (e) {
    console.warn('[Google Auth] Erro ao carregar custom config do localStorage:', e);
  }

  // 2. Check import.meta.env
  const env = (import.meta as any).env || {};
  if (env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: String(env.VITE_FIREBASE_API_KEY).trim(),
      authDomain: String(env.VITE_FIREBASE_AUTH_DOMAIN || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`).trim(),
      projectId: String(env.VITE_FIREBASE_PROJECT_ID).trim(),
      storageBucket: String(env.VITE_FIREBASE_STORAGE_BUCKET || `${env.VITE_FIREBASE_PROJECT_ID}.appspot.com`).trim(),
      messagingSenderId: String(env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
      appId: String(env.VITE_FIREBASE_APP_ID || '').trim(),
      oAuthClientId: String(env.VITE_FIREBASE_OAUTH_CLIENT_ID || '').trim(),
    };
  }

  // 3. Fallback to bundled firebase-applet-config.json
  return firebaseConfig as CustomFirebaseConfig;
};

export const isUsingCustomFirebase = (): boolean => {
  try {
    return !!localStorage.getItem(STORAGE_KEY_CUSTOM_CONFIG);
  } catch {
    return false;
  }
};

export const isUsingEnvFirebase = (): boolean => {
  const env = (import.meta as any).env || {};
  return !!(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID);
};

export const saveCustomFirebaseConfig = (cfg: CustomFirebaseConfig): void => {
  localStorage.setItem(STORAGE_KEY_CUSTOM_CONFIG, JSON.stringify(cfg));
  // Clear any existing cached token from previous project
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_TIME);
  localStorage.removeItem(STORAGE_KEY_USER);
};

export const resetCustomFirebaseConfig = (): void => {
  localStorage.removeItem(STORAGE_KEY_CUSTOM_CONFIG);
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_TIME);
  localStorage.removeItem(STORAGE_KEY_USER);
};

// Initialize Firebase App
const effectiveConfig = getEffectiveFirebaseConfig();
const app = getApps().length > 0 ? getApp() : initializeApp(effectiveConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export interface SavedGoogleUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

/**
 * Returns saved Google user info from localStorage if available.
 */
export const getSavedGoogleUser = (): SavedGoogleUser | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Formats Firebase Auth errors into clear, actionable diagnosis in Portuguese
 */
export const formatFirebaseError = (error: any): FirebaseErrorInfo => {
  const code = String(error?.code || error?.name || '');
  const rawMsg = String(error?.message || '');
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'seu-servidor';
  const currentProtocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';

  if (code.includes('unauthorized-domain') || rawMsg.includes('unauthorized-domain')) {
    return {
      title: 'Domínio Não Autorizado no Firebase',
      code: 'auth/unauthorized-domain',
      isConfigIssue: true,
      message: `O endereço "${currentHostname}" não está autorizado no Firebase Console. Para liberar o acesso: vá em console.firebase.google.com -> Seu Projeto -> Authentication -> Configurações -> Domínios Autorizados e adicione "${currentHostname}".`,
    };
  }

  if (
    code.includes('operation-not-supported-in-this-environment') ||
    (currentProtocol === 'http:' && currentHostname !== 'localhost' && currentHostname !== '127.0.0.1')
  ) {
    return {
      title: 'Conexão Segura (HTTPS) Obrigatória',
      code: 'auth/operation-not-supported-in-this-environment',
      isConfigIssue: true,
      message: `O Google OAuth proíbe login em conexões HTTP inseguras (você está em "${currentProtocol}//${currentHostname}"). No Easypanel, ative o certificado SSL / HTTPS nas configurações de domínio do seu aplicativo.`,
    };
  }

  if (code.includes('popup-blocked') || rawMsg.includes('popup')) {
    return {
      title: 'Janela Pop-up Bloqueada pelo Navegador',
      code: 'auth/popup-blocked',
      isConfigIssue: false,
      message: 'O navegador impediu a abertura do popup de login do Google. Clique no ícone de pop-up bloqueado na barra de endereços e permita pop-ups para este site.',
    };
  }

  if (code.includes('popup-closed-by-user')) {
    return {
      title: 'Login Cancelado',
      code: 'auth/popup-closed-by-user',
      isConfigIssue: false,
      message: 'A janela de autenticação foi fechada antes de selecionar a conta Google.',
    };
  }

  if (code.includes('invalid-api-key') || rawMsg.includes('API key')) {
    return {
      title: 'Chave de API do Firebase Inválida',
      code: 'auth/invalid-api-key',
      isConfigIssue: true,
      message: 'A apiKey configurada no Firebase é inválida. Verifique os dados em "Configurar Firebase Próprio" no painel.',
    };
  }

  if (code.includes('configuration-not-found')) {
    return {
      title: 'Provedor Google Não Habilitado',
      code: 'auth/configuration-not-found',
      isConfigIssue: true,
      message: 'O login com Google não foi ativado no Firebase Console. Vá em Authentication -> Sign-in method -> Adicionar novo provedor -> Google e ative-o.',
    };
  }

  return {
    title: 'Erro de Autenticação Google',
    code: code || 'auth/unknown',
    isConfigIssue: true,
    message: rawMsg || 'Falha na autenticação com o Google Workspace.',
  };
};

/**
 * Retrieves valid Google OAuth 2.0 access token from memory or persistent storage.
 */
export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  try {
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const savedTime = localStorage.getItem(STORAGE_KEY_TIME);
    if (savedToken) {
      if (savedTime) {
        const ageMs = Date.now() - parseInt(savedTime, 10);
        // Valid for up to 60 minutes
        if (ageMs < 60 * 60 * 1000) {
          cachedAccessToken = savedToken;
          return savedToken;
        } else {
          // Token is expired, remove expired markers
          localStorage.removeItem(STORAGE_KEY_TOKEN);
          localStorage.removeItem(STORAGE_KEY_TIME);
        }
      } else {
        cachedAccessToken = savedToken;
        return savedToken;
      }
    }
  } catch (e) {
    console.warn('[Google Auth] Erro ao ler token do localStorage:', e);
  }

  return null;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (token) {
    try {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
      localStorage.setItem(STORAGE_KEY_TIME, Date.now().toString());
    } catch {}
  } else {
    try {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_TIME);
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch {}
  }
};

export const initAuth = (
  onAuthSuccess?: (user: User | SavedGoogleUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check if we already have a valid persisted token
  const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
  const savedTime = localStorage.getItem(STORAGE_KEY_TIME);
  const savedUser = getSavedGoogleUser();
  if (savedToken && savedTime) {
    const ageMs = Date.now() - parseInt(savedTime, 10);
    if (ageMs < 55 * 60 * 1000) {
      cachedAccessToken = savedToken;
      if (savedUser && onAuthSuccess) {
        onAuthSuccess(savedUser, savedToken);
      }
    }
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = await getAccessToken();
      if (token) {
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      if (!cachedAccessToken) {
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter token de acesso com permissão para Google Drive e Planilhas.');
    }

    cachedAccessToken = credential.accessToken;
    try {
      localStorage.setItem(STORAGE_KEY_TOKEN, credential.accessToken);
      localStorage.setItem(STORAGE_KEY_TIME, Date.now().toString());
      localStorage.setItem(
        STORAGE_KEY_USER,
        JSON.stringify({
          uid: result.user.uid,
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
        })
      );
    } catch (e) {
      console.warn('[Google Auth] Erro ao persistir dados de autenticação:', e);
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('[Google Auth] Erro no login:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Ensures a valid Google OAuth access token is ready, prompting sign-in if needed.
 */
export const ensureGoogleAuth = async (): Promise<{ token: string; user?: any }> => {
  const token = await getAccessToken();
  if (token) {
    const user = getSavedGoogleUser() || auth.currentUser;
    return { token, user };
  }

  const res = await googleSignIn();
  if (!res || !res.accessToken) {
    throw new Error('Autenticação com o Google Workspace não foi concluída.');
  }

  return { token: res.accessToken, user: res.user };
};

export const logoutGoogle = async () => {
  try {
    await signOut(auth);
  } catch {}
  setCachedAccessToken(null);
};
