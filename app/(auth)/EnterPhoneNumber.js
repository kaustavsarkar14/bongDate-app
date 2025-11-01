import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView, // 1. Import
  ScrollView, // 2. Import
  Platform, // 3. Import
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase.config";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationDataContext";

const EnterPhoneNumber = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { updateFormData, formData } = useRegistration();
  const handleNext = async () => {
    // Basic validation
    if (phoneNumber.trim().length < 10) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid phone number with your country code."
      );
      return;
    }

    setIsLoading(true);
    updateFormData({ ...formData, phoneNumber });
    try {
      // 1. Create a query to check for the phone number in the "users" collection
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("phoneNumber", "==", phoneNumber.trim()));

      // 2. Execute the query
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // 3. User does NOT exist
        // Navigate to the first registration page, passing the phone number
        router.push("RegistrationPage1");
      } else {
        // 4. User EXISTS
        // Navigate to the OTP verification page, passing the phone number
        router.push("ValidateOTP");
      }
    } catch (error) {
      console.error("Error checking phone number: ", error);
      Alert.alert("Error", "Could not verify phone number. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 4. Add KeyboardAvoidingView wrapper */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* 5. Replace View with ScrollView */}
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Enter Your Phone Number</Text>
          <Text style={styles.subtitle}>
            We'll check if you have an account or help you create one.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="+91 Phone Number"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Next</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  // 6. Add style for the new wrapper
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    // 7. Change flex: 1 to flexGrow: 1
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    width: "100%",
    backgroundColor: "#E91E63", // Pink color, change as needed
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  buttonDisabled: {
    backgroundColor: "#B0B0B0", // Gray when disabled
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default EnterPhoneNumber;
