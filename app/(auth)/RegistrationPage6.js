import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Linking, // 1. Import Linking to handle external links
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationDataContext";
import { ChevronRight } from "lucide-react-native";

// --- Mock Data ---
const RELIGION_OPTIONS = [
  { slug: "agnostic", label: "Agnostic" },
  { slug: "atheist", label: "Atheist" },
  { slug: "buddhist", label: "Buddhist" },
  { slug: "catholic", label: "Catholic" },
  { slug: "christian", label: "Christian" },
  { slug: "hindu", label: "Hindu" },
  { slug: "jain", label: "Jain" },
  { slug: "jewish", label: "Jewish" },
  { slug: "mormon", label: "Mormon" },
  { slug: "latter-day-saint", label: "Latter-day Saint" },
  { slug: "muslim", label: "Muslim" },
  { slug: "zoroastrian", label: "Zoroastrian" },
  { slug: "sikh", label: "Sikh" },
  { slug: "spiritual", label: "Spiritual" },
  { slug: "other", label: "Other" },
];

const POLITICS_OPTIONS = [
  { slug: "apolitical", label: "Apolitical" },
  { slug: "moderate", label: "Moderate" },
  { slug: "left", label: "Left" },
  { slug: "right", label: "Right" },
  { slug: "communist", label: "Communist" },
  { slug: "socialist", label: "Socialist" },
];
// -----------------

// Next button icon
const ArrowIcon = () => (
  <View style={styles.arrowIcon}>
    <ChevronRight color="#fff" size={28} strokeWidth={3} />
  </View>
);

const RegistrationPage6 = () => {
  const { formData, updateFormData } = useRegistration();
  // State for this page. Allow null for "no selection".
  const [religion, setReligion] = useState(formData.religion || null);
  const [politics, setPolitics] = useState(formData.politics || null);
  const router = useRouter();

  // Toggle selection logic: if you tap the same one, it deselects.
  const handleSelectReligion = (slug) => {
    setReligion((prev) => (prev === slug ? null : slug));
  };

  const handleSelectPolitics = (slug) => {
    setPolitics((prev) => (prev === slug ? null : slug));
  };

  const handleNext = () => {
    // This page is optional, so we don't need validation
    updateFormData({ religion, politics });
    console.log("Step 6 Data Updated:", { ...formData, religion, politics });
    // Navigate to the next step
    router.push("/(auth)/RegistrationPage7"); // Next: ID verification
  };

  const handleSkip = () => {
    // Save null values (or just don't update) and proceed
    updateFormData({ religion: null, politics: null });
    router.push("/(auth)/RegistrationPage7");
  };

  // Helper component for the selection "pills" (no emoji)
  const SelectionPill = ({ label, selected, onSelect }) => (
    <TouchableOpacity
      style={[styles.pill, selected && styles.pillSelected]}
      onPress={onSelect}
    >
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
        {label}
      </Text>
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
          <Text style={styles.title}>What's important in your life?</Text>
          <Text style={styles.subtitle}>
            This is sensitive information that'll be on your profile. It helps
            you find people, and people find you. It's totally optional.
          </Text>
          <TouchableOpacity onPress={() => Alert.alert("Why we're asking", "This info helps us find you better matches.")}>
            <Text style={styles.linkText}>Why we're asking</Text>
          </TouchableOpacity>

          {/* Religion Section */}
          <Text style={styles.sectionTitle}>Religion</Text>
          <View style={styles.pillContainer}>
            {RELIGION_OPTIONS.map((item) => (
              <SelectionPill
                key={item.slug}
                label={item.label}
                selected={religion === item.slug}
                onSelect={() => handleSelectReligion(item.slug)}
              />
            ))}
          </View>

          {/* Politics Section */}
          <Text style={styles.sectionTitle}>Politics</Text>
          <View style={styles.pillContainer}>
            {POLITICS_OPTIONS.map((item) => (
              <SelectionPill
                key={item.slug}
                label={item.label}
                selected={politics === item.slug}
                onSelect={() => handleSelectPolitics(item.slug)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Footer (No counter) */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipButton}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <ArrowIcon />
          </TouchableOpacity>
        </View>

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
    padding: 20,
    paddingBottom: 100, // Space for the footer
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
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  linkText: {
    fontSize: 16,
    color: "#E91E63",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 30,
    textDecorationLine: "underline",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  // Pills
  pillContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: 20, // Space between sections
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    marginBottom: 10,
  },
  pillSelected: {
    borderColor: "#E91E63",
    backgroundColor: "#FFF1F5",
    borderWidth: 2,
  },
  pillText: {
    fontSize: 14,
    color: "#333",
  },
  pillTextSelected: {
    color: "#E91E63",
    fontWeight: "bold",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  skipButton: {
    fontSize: 18,
    color: "#666",
    fontWeight: "500",
  },
  // Floating Buttons
  nextButton: {
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
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 30,
    color: "#333",
  },
});

export default RegistrationPage6;
