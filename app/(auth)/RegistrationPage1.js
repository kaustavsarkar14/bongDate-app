import {
  View,
  Text,
  TextInput,
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
// 1. Import the date time picker
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRegistration } from "../../context/RegistrationDataContext";
// 2. Import the Registration Context hook


const RegistrationPage1 = () => {
  // 3. Use the context
  const { formData, updateFormData } = useRegistration();
  
  // 4. Set initial state from the context (if it exists)
  const [name, setName] = useState(formData.name || "");
  const [date, setDate] = useState(formData.birthdate ? new Date(formData.birthdate) : new Date());
  const [showPicker, setShowPicker] = useState(false);

  const router = useRouter();

  // 5. Handle the date selection
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === 'ios'); // iOS needs manual closing
    setDate(currentDate);

    // Format the date to "YYYY-MM-DD"
    const formattedDate = currentDate.toISOString().split('T')[0];
    
    // 6. Update the central context with the new date
    updateFormData({ birthdate: formattedDate });
  };

  const handleNext = () => {
    if (name.trim().length < 2) {
      Alert.alert("Invalid Name", "Please enter your full name.");
      return;
    }
    // Check if a birthdate has been set in the context
    if (!formData.birthdate) {
      Alert.alert("Invalid Birthdate", "Please select your birthdate.");
      return;
    }

    // 7. Update the name in the context
    updateFormData({ name });

    console.log("Step 1 Data Updated:", { ...formData, name });

    // 8. Navigate without params (data is in the context)
    router.push("/(auth)/RegistrationPage2"); // Make sure this page exists
  };

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
          <Text style={styles.title}>Step 1: Tell us about you</Text>
          <Text style={styles.subtitle}>
            This information will be used to create your profile.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Your Full Name"
            textContentType="name"
            value={name}
            onChangeText={setName}
          />

          {/* 9. This is the "fake" input that opens the picker */}
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.dateText}>
              {formData.birthdate || "Birthdate (YYYY-MM-DD)"}
            </Text>
          </TouchableOpacity>

          {/* 10. This is the actual Date Picker component */}
          {/* It's hidden until `showPicker` is true */}
          {showPicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode={"date"}
              is24Hour={true}
              display="default" // "spinner" is also an option
              onChange={onDateChange}
              maximumDate={new Date(Date.now() - (18 * 365.25 * 24 * 60 * 60 * 1000))} // Example: 18+ years old
            />
          )}

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Next</Text>
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
    marginBottom: 20,
    // Add this to make the TouchableOpacity align text like the TextInput
    justifyContent: 'center', 
  },
  dateText: {
    fontSize: 18,
    color: '#000', // Or a placeholder color if formData.birthdate is empty
  },
  button: {
    width: "100%",
    backgroundColor: "#E91E63", // Pink color
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default RegistrationPage1;

