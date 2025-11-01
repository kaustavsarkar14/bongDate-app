import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Switch, // 1. Import Switch for the toggle
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationDataContext";
import { ChevronRight, Eye } from "lucide-react-native"; 

// Next button icon
const ArrowIcon = () => (
  <View style={styles.arrowIcon}>
    <ChevronRight color="#fff" size={28} strokeWidth={3} />
  </View>
);

const RegistrationPage3 = () => {
  const { formData, updateFormData } = useRegistration();
  
  // oppositeGenderPreference are stored as an array, e.g., ['man', 'woman']
  const [oppositeGenderPreference, setoppositeGenderPreference] = useState(formData.oppositeGenderPreference || []);
  
  // State for the "open to everyone" toggle
  const [openToEveryone, setOpenToEveryone] = useState(
    oppositeGenderPreference.length === 3 // Auto-check if all are selected
  );
  
  const router = useRouter();
  const allOptions = ["man", "woman", "nonbinary"];

  // Effect to manage the "open to everyone" toggle
  useEffect(() => {
    if (openToEveryone) {
      setoppositeGenderPreference(allOptions);
    } else {
      // If user toggles off, clear oppositeGenderPreference unless they were already partial
      if (oppositeGenderPreference.length === allOptions.length) {
        setoppositeGenderPreference([]);
      }
    }
  }, [openToEveryone]);

  // Handle selecting an individual preference
  const handleSelectPreference = (option) => {
    if (openToEveryone) return; // Do nothing if toggle is on

    let newoppositeGenderPreference;
    if (oppositeGenderPreference.includes(option)) {
      // De-select
      newoppositeGenderPreference = oppositeGenderPreference.filter((item) => item !== option);
    } else {
      // Select
      newoppositeGenderPreference = [...oppositeGenderPreference, option];
    }
    setoppositeGenderPreference(newoppositeGenderPreference);

    // Check if all are selected, and update the "everyone" toggle
    if (newoppositeGenderPreference.length === allOptions.length) {
      setOpenToEveryone(true);
    }
  };

  const handleNext = () => {
    if (oppositeGenderPreference.length === 0) {
      Alert.alert("Please select an option", "Who would you like to meet?");
      return;
    }

    // Save the oppositeGenderPreference array to the central context
    updateFormData({ oppositeGenderPreference });

    console.log("Step 3 Data Updated:", { ...formData, oppositeGenderPreference });

    // Navigate to the next step
    router.push("RegistrationPage4"); // You'll create this page next
  };

  // Helper to create a checkbox button (based on your image)
  const Checkbox = ({ label, selected, onSelect, disabled }) => (
    <TouchableOpacity
      style={[styles.checkboxButton, selected && styles.checkboxSelected]}
      onPress={onSelect}
      disabled={disabled}
    >
      <Text
        style={[
          styles.checkboxButtonText,
          selected && styles.checkboxTextSelected,
          disabled && styles.checkboxTextDisabled,
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.checkboxSquare,
          selected && styles.checkboxSquareSelected,
          disabled && styles.checkboxSquareDisabled,
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
          <Text style={styles.title}>Who would you like to meet?</Text>
          <Text style={styles.subtitle}>
            You can choose more than one answer and change it any time.
          </Text>

          {/* "Open to everyone" Toggle Row */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>I'm open to dating everyone</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#E91E63" }}
              thumbColor={openToEveryone ? "#f4f3f4" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={setOpenToEveryone}
              value={openToEveryone}
            />
          </View>

          {/* Preference Checkboxes */}
          <View style={styles.checkboxGroup}>
            <Checkbox
              label="man"
              selected={oppositeGenderPreference.includes("man")}
              onSelect={() => handleSelectPreference("man")}
              disabled={openToEveryone}
            />
            <Checkbox
              label="woman"
              selected={oppositeGenderPreference.includes("woman")}
              onSelect={() => handleSelectPreference("woman")}
              disabled={openToEveryone}
            />
            <Checkbox
              label="nonbinary people"
              selected={oppositeGenderPreference.includes("nonbinary")}
              onSelect={() => handleSelectPreference("nonbinary")}
              disabled={openToEveryone}
            />
          </View>
        </ScrollView>
        
        {/* Footer Note */}
        <View style={styles.footerNote}>
          <Eye color="#666" size={20} />
          <Text style={styles.footerText}>
            You'll only be shown to people looking to date your gender (
            {formData.gender || "..."}).
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
  // Toggle Row
  toggleRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 30,
    marginBottom: 20,
  },
  toggleText: {
    fontSize: 18,
    color: "#333",
  },
  // Checkbox Styles
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
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 100, // Make space for the next button
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
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

export default RegistrationPage3;
