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

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

const STORAGE_KEY_TOKEN = 'multilagos_google_workspace_token';
const STORAGE_KEY_TIME = 'multilagos_google_token_time';
const STORAGE_KEY_USER = 'multilagos_google_user';

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
