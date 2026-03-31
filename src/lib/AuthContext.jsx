import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { syncUser } from "@/api/user";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await syncUser(firebaseUser);
        }
        setUser(firebaseUser || null);
      } catch (error) {
        console.error("Auth sync error:", error);
        setAuthError(error);
        setUser(firebaseUser || null);
      } finally {
        setIsLoadingAuth(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,

      loginWithGoogle: async () => {
        const result = await signInWithPopup(auth, googleProvider);
        await syncUser(result.user);
      },

      loginWithEmail: async (email, pass) => {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        await syncUser(result.user);
      },

      registerWithEmail: async (email, pass, username) => {
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(result.user, {
          displayName: username,
        });
        await syncUser(result.user);
      },

      logout: async () => {
        await signOut(auth);
      },

      navigateToLogin: async () => {
        try {
          setAuthError(null);
          const result = await signInWithPopup(auth, googleProvider);
          await syncUser(result.user);
        } catch (error) {
          setAuthError(error);
          throw error;
        }
      },
    }),
    [user, isLoadingAuth, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
