import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationDataContext";
import { ChevronRight,ChevronLeft } from "lucide-react-native";


// A simple arrow icon component
const ArrowIcon = () => (
  <View style={styles.arrowIcon}>
    <Text style={styles.arrowIconText}>→</Text>
  </View>
);

const RegistrationPage2 = () => {
  const { formData, updateFormData } = useRegistration();
  // Set initial state from context, if it exists
  const [gender, setGender] = useState(formData.gender || null);
  const router = useRouter();

  const handleNext = () => {
    if (!gender) {
      Alert.alert("Please select an option", "You must select your gender to continue.");
      return;
    }

    // Save the selected gender to the central context
    updateFormData({ gender });

    router.push("/(auth)/RegistrationPage3"); // You'll create this page next
  };

  // Helper to create a radio button
  const RadioButton = ({ label, selected, onSelect }) => (
    <TouchableOpacity
      style={[styles.radioButton, selected && styles.radioButtonSelected]}
      onPress={onSelect}
    >
      <Text
        style={[
          styles.radioButtonText,
          selected && styles.radioButtonTextSelected,
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.radioCircle,
          selected && styles.radioCircleSelected,
        ]}
      >
        {selected && <View style={styles.radioDot} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Use the name from context for a personal touch */}
          <Text style={styles.title}>
            What's your gender, {formData.name || "User"}?
          </Text>
          <Text style={styles.subtitle}>
            This helps us find you the right matches.
          </Text>

          <View style={styles.radioGroup}>
            <RadioButton
              label="woman"
              selected={gender === "woman"}
              onSelect={() => setGender("woman")}
            />
            <RadioButton
              label="man"
              selected={gender === "man"}
              onSelect={() => setGender("man")}
            />
            <RadioButton
              label="nonbinary"
              selected={gender === "nonbinary"}
              onSelect={() => setGender("nonbinary")}
            />
          </View>
        </ScrollView>
        
        {/* Floating "Next" Button */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <ChevronRight color={"white"} />
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
         <ChevronLeft />
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
    paddingBottom: 100, // Add padding to avoid floating buttons
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
  // Radio Button Styles
  radioGroup: {
    width: "100%",
  },
  radioButton: {
    width: "100%",
    height: 55,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 30,
    paddingHorizontal: 20,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  radioButtonSelected: {
    borderColor: "#E91E63", // Pink color
    borderWidth: 2,
  },
  radioButtonText: {
    fontSize: 18,
    color: "#333",
  },
  radioButtonTextSelected: {
    fontWeight: "bold",
    color: "#E91E63",
  },
  radioCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: "#E91E63",
  },
  radioDot: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: "#E91E63",
  },
  // Floating Buttons
  nextButton: {
    position: "absolute",
    bottom: 40,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E91E63",
    alignItems: "center",
    justifyContent: "center",
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Android shadow
    elevation: 5,
  },
  arrowIcon: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowIconText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 30,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 10 : 20, // Adjust based on platform
    left: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 30,
    color: "#333",
  },
});

export default RegistrationPage2;

