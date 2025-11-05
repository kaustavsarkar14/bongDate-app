import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";
import { createContext, use, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase.config";
import { addDoc, collection, doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(undefined);
  const router = useRouter();
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const response = await getUser(user.uid);
        setUser(response);

        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });
  }, []);
  const login = async (email, password) => {
    try {
      // Use Firebase to sign in with email and password
      const response = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting the user state
      console.log(response);
      return response.user;
    } catch (error) {
      console.log("Error logging in:", error);
      alert("Login Error", error.message);
      throw error;
    }
  };

  const OTPLogin = async (phoneNumber, recaptchaVerifier) => {
    console.log("OTPLogin function called for:", phoneNumber);
    try {
      const confirmation = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifier
      );
      console.log("OTP sent to ", phoneNumber);
      return confirmation;
    } catch (error) {
      console.error("Error sending OTP:", error.message);
      alert("OTP Error", error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      Toast.show({
        type: "success",
        text1: "You have been logged out.",
      });
    } catch (error) {
      console.log("Error logging out:", error);
      Toast.show({
        type: "error",
        text1: "Logout Error",
      });
      throw error;
    }
  };
  const signUp = async ({ formData, uid }) => {
    try {
      const response = await setDoc(doc(db, "users", uid), {
        ...formData,
        uid,
      });
      setUser({ ...formData, uid });
    } catch (error) {
      console.log("Error signing up:", error);
      alert("Signup Error", error.message);
      throw error;
    }
  };
  const getUser = async (uid) => {

    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      // 3. FIX: Check if the document actually exists.
      // getDoc() does NOT throw an error if the doc is not found.
      if (docSnap.exists()) {
        return docSnap.data(); // Return the user's data
      } else {
        // Handle the case where the user's profile doesn't exist
        console.log("No user document found for uid:", uid);
        return null; // Return null (safer than undefined)
      }
    } catch (error) {
      // This will catch permissions errors or network issues
      console.log("Error getting user:", error);
      alert("Get User Error", error.message);
      throw error;
    }
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        login,
        logout,
        signUp,
        OTPLogin,
        getUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(" useAuth must be used within AuthProvider");
  }
  return context;
};
