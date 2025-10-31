import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase.config";
import { doc, setDoc } from "firebase/firestore";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(undefined);

  useEffect(() => {
    setIsAuthenticated(false)
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
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
      // Use Firebase to sign out
      await signOut(auth);
      // onAuthStateChanged will handle setting the user state to null
    } catch (error) {
      console.log("Error logging out:", error);
      alert("Logout Error", error.message);
      throw error;
    }
  };
  const signup = async (email, password) => {
    try {
      const response = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await setDoc(doc(db, "users", response.user.uid), {
        username: "test username",
        email: email,
        userId: response.user.uid,
      });

      return response.user;
    } catch (error) {
      console.log("Error signing up:", error);
      alert("Signup Error", error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, logout, signup, OTPLogin }}
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
