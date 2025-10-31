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
// Updated import path as per your example
import { useRegistration } from "../../context/RegistrationDataContext";
import { ChevronRight, Eye } from "lucide-react-native";

// Next button icon
const ArrowIcon = () => (
  <View style={styles.arrowIcon}>
    <ChevronRight color="#fff" size={28} strokeWidth={3} />
  </View>
);

const RegistrationPage4 = () => {
  const { formData, updateFormData } = useRegistration();
  // State for selected intentions, stored as an array
  const [intentions, setIntentions] = useState(formData.intentions || []);
  const router = useRouter();

  const handleSelectIntention = (option) => {
    let newIntentions;
    if (intentions.includes(option)) {
      // Deselect option
      newIntentions = intentions.filter((item) => item !== option);
    } else {
      // Select option, but check the limit first
      if (intentions.length >= 2) {
        Alert.alert(
          "Selection Limit",
          "You can choose a maximum of 2 options."
        );
        return;
      }
      newIntentions = [...intentions, option];
    }
    setIntentions(newIntentions);
  };

  const handleNext = () => {
    if (intentions.length === 0) {
      Alert.alert(
        "Please select an option",
        "You must select at least one intention to continue."
      );
      return;
    }

    // Save the intentions array to the central context
    // The state `intentions` already contains the slug values
    updateFormData({ intentions });

    console.log("Step 4 Data Updated:", { ...formData, intentions });

    // Navigate to the next step
    router.push("/(auth)/RegistrationPage5"); // You'll create this page next
  };

  // Helper to create a checkbox button (reusing the style from Page 3)
  const Checkbox = ({ label, selected, onSelect }) => (
    <TouchableOpacity
      style={[styles.checkboxButton, selected && styles.checkboxSelected]}
      onPress={onSelect}
    >
      <Text
        style={[
          styles.checkboxButtonText,
          selected && styles.checkboxTextSelected,
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.checkboxSquare,
          selected && styles.checkboxSquareSelected,
        ]}
      >
        {selected && <View style={styles.checkboxDot} />}
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
          <Text style={styles.title}>And what are you hoping to find?</Text>
          <Text style={styles.subtitle}>
            It's your dating journey, so choose 1 or 2 options that feel right
            for you.
          </Text>

          {/* Intention Checkboxes - Updated values */}
          <View style={styles.checkboxGroup}>
            <Checkbox
              label="A long-term relationship"
              selected={intentions.includes("long-term-relationship")}
              onSelect={() => handleSelectIntention("long-term-relationship")}
            />
            <Checkbox
              label="A life partner"
              selected={intentions.includes("life-partner")}
              onSelect={() => handleSelectIntention("life-partner")}
            />
            <Checkbox
              label="Fun, casual dates"
              selected={intentions.includes("fun-casual-dates")}
              onSelect={() => handleSelectIntention("fun-casual-dates")}
            />
            <Checkbox
              label="Intimacy, without commitment"
              selected={intentions.includes("intimacy-without-commitment")}
              onSelect={() =>
                handleSelectIntention("intimacy-without-commitment")
              }
            />
            <Checkbox
              label="Marriage"
              selected={intentions.includes("marriage")}
              onSelect={() => handleSelectIntention("marriage")}
            />
            <Checkbox
              label="Ethical non-monogamy"
              selected={intentions.includes("ethical-non-monogamy")}
              onSelect={() => handleSelectIntention("ethical-non-monogamy")}
            />
          </View>
        </ScrollView>

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <Eye color="#666" size={20} />
          <Text style={styles.footerText}>
            This will show on your profile to help everyone find what they're
            looking for.
          </Text>
        </View>

        {/* Floating "Next" Button */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <ArrowIcon />
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>←</Text>
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
    paddingBottom: 120, // Add padding to avoid floating buttons and footer
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
  // Checkbox Styles (reused from RegistrationPage3)
  checkboxGroup: {
    width: "100%",
  },
  checkboxButton: {
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
  checkboxSelected: {
    borderColor: "#E91E63", // Pink color
    borderWidth: 2,
  },
  checkboxButtonText: {
    fontSize: 18,
    color: "#333",
  },
  checkboxTextSelected: {
    fontWeight: "bold",
    color: "#E91E63",
  },
  checkboxTextDisabled: {
    color: "#aaa",
  },
  checkboxSquare: {
    height: 24,
    width: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSquareSelected: {
    borderColor: "#E91E63",
  },
  checkboxSquareDisabled: {
    borderColor: "#eee",
  },
  checkboxDot: {
    height: 12,
    width: 12,
    borderRadius: 4,
    backgroundColor: "#E91E63",
  },
  // Footer Note
  footerNote: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 100, // Make space for the next button
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
    flexShrink: 1, // Allow text to wrap
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
    elevation: 5,
  },
  arrowIcon: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 10 : 20,
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

export default RegistrationPage4;

