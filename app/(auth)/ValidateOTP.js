import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { app } from "../../firebase.config"; // Make sure this path is correct
import { useAuth } from "../../context/AuthContext";
import { useRegistration } from "../../context/RegistrationDataContext";
import { SafeAreaView } from "react-native-safe-area-context";

const OTP_LENGTH = 6;

export default function ValidateOTP() {
  const { OTPLogin } = useAuth();
  const { formData } = useRegistration(); // Get data from our registration form
  const router = useRouter();

  const recaptchaVerifier = useRef(null);
  const otpInputRef = useRef(null); // Ref for the hidden text input

  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading to auto-send
  const [error, setError] = useState(null);

  // 1. Auto-send OTP when the screen loads
  useEffect(() => {
    const sendOtp = async () => {
      // Ensure phone number and verifier are ready
      if (!formData.phoneNumber || !recaptchaVerifier.current) {
        Alert.alert("Error", "Could not get phone number. Please go back.");
        setIsLoading(false);
        return router.replace("EnterPhoneNumber");
      }

      setError(null);
      console.log(`Sending OTP to: ${formData.phoneNumber}`);

      try {
        const confirmationResult = await OTPLogin(
          formData.phoneNumber,
          recaptchaVerifier.current
        );
        // This will pop the reCAPTCHA modal.
        // After the user solves it, the promise resolves.

        setConfirmation(confirmationResult);
        Alert.alert(
          "OTP Sent",
          `A code has been sent to ${formData.phoneNumber}`
        );
        otpInputRef.current?.focus(); // Focus the input
      } catch (err) {
        console.error(err);
        setError("Failed to send OTP. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    sendOtp();
  }, [recaptchaVerifier, OTPLogin, formData.phoneNumber]); // Run once on load

  // 2. Auto-verify when OTP is 6 digits
  useEffect(() => {
    if (otp.length === OTP_LENGTH) {
      verifyOtp(otp);
    }
  }, [otp]);

  // 3. Verify the OTP
  const verifyOtp = async (code) => {
    if (!confirmation) {
      setError("Please send the OTP first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await confirmation.confirm(code);
      Alert.alert("Success!", "Your phone number has been verified.");
      // The onAuthStateChanged in your AuthContext will
      // also detect this and set isAuthenticated = true.

      console.log(formData);
    } catch (err) {
      console.error(err);
      setError("Invalid OTP. Please try again.");
      setOtp(""); // Clear the input
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Functions ---

  // Renders the 6 "modern" OTP boxes
  const renderOtpBoxes = () => {
    return (
      <Pressable
        style={styles.otpContainer}
        onPress={() => otpInputRef.current?.focus()}
      >
        {[...Array(OTP_LENGTH)].map((_, index) => {
          const digit = otp[index] || "";
          const isFocused = otp.length === index;

          return (
            <View
              key={index}
              style={[
                styles.otpBox,
                error && styles.otpError,
                isFocused && styles.otpFocused,
              ]}
            >
              <Text style={styles.otpText}>{digit}</Text>
            </View>
          );
        })}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* This modal will pop up on load due to the useEffect call */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to {formData.phone}
          </Text>

          {/* This is the hidden input that actually handles typing */}
          <TextInput
            ref={otpInputRef}
            style={styles.hiddenInput}
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
            maxLength={OTP_LENGTH}
            caretHidden // Hide the cursor
          />

          {/* These are the visible boxes */}
          {renderOtpBoxes()}

          {isLoading && (
            <ActivityIndicator
              size="large"
              color="#E91E63"
              style={styles.loader}
            />
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.footerTextContainer}>
            <Text style={styles.footerText}>Didn't receive a code?</Text>
            <TouchableOpacity
              onPress={() => {
                setOtp("");
                setIsLoading(true);
                // Re-run the send OTP logic
                sendOTP();
              }}
            >
              <Text style={styles.resendText}>Resend</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  hiddenInput: {
    width: 0,
    height: 0,
    position: "absolute",
    opacity: 0,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  otpBox: {
    width: 50,
    height: 60,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  otpText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  otpFocused: {
    borderColor: "#E91E63",
    borderWidth: 2,
  },
  otpError: {
    borderColor: "#FF0000",
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    color: "#FF0000",
    marginTop: 20,
    fontSize: 14,
  },
  footerTextContainer: {
    flexDirection: "row",
    marginTop: 30,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#666",
  },
  resendText: {
    fontSize: 14,
    color: "#E91E63",
    fontWeight: "bold",
    marginLeft: 5,
  },
});
