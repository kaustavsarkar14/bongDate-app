import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  ActivityIndicator, // 1. Import ActivityIndicator
} from "react-native";
import React, { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationDataContext";
import { ChevronRight, Search, Check } from "lucide-react-native"; // 2. Import Check icon
import { ALL_INTERESTS_DATA } from "../../utilities/constants";

// --- PRODUCTION: Import Firebase and Auth ---
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth } from "../../context/AuthContext";

// --- Mock Data ---
const ALL_INTERESTS = ALL_INTERESTS_DATA;

// --- Icons ---
const ArrowIcon = () => (
  <View style={styles.arrowIcon}>
    <ChevronRight color="#fff" size={28} strokeWidth={3} />
  </View>
);

// 3. Add CheckIcon for "Update" mode
const CheckIcon = () => (
  <View style={styles.arrowIcon}>
    <Check color="#fff" size={28} strokeWidth={3} />
  </View>
);

const RegistrationPage5 = () => {
  const { formData, updateFormData } = useRegistration();
  const { user, setUser } = useAuth(); // 4. Get Auth context
  const router = useRouter();

  // 5. Determine mode
  const isUpdateMode = user && user.interests; // Check if user has interests array

  // 6. Add loading state
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 7. Initialize state from user (update) or form (registration)
  const [selectedInterests, setSelectedInterests] = useState(() => {
    const source = isUpdateMode ? user.interests : formData.interests;
    return source || [];
  });

  // Filter interests (unchanged)
  const filteredInterests = useMemo(() => {
    if (!searchQuery) {
      return ALL_INTERESTS;
    }
    return ALL_INTERESTS.filter((interest) =>
      interest.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Handle selection (unchanged)
  const handleSelectInterest = (slug) => {
    let newInterests;
    if (selectedInterests.includes(slug)) {
      newInterests = selectedInterests.filter((item) => item !== slug);
    } else {
      if (selectedInterests.length >= 5) {
        Alert.alert("Limit Reached", "You can choose a maximum of 5 interests.");
        return;
      }
      newInterests = [...selectedInterests, slug];
    }
    setSelectedInterests(newInterests);
  };

  // 8. Create the main submit function
  const submitData = async () => {
    if (isUpdateMode) {
      // --- Update Profile Logic ---
      if (!user) return;
      setIsLoading(true);
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          interests: selectedInterests,
        });

        if (setUser) {
          setUser({ ...user, interests: selectedInterests });
        }
        
        Alert.alert("Interests Updated", "Your interests have been saved.");
        router.back(); // Go back to profile page
      } catch (error) {
        console.error("Update failed:", error);
        Alert.alert("Error", "Could not update your interests.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // --- Registration Logic (Original) ---
      updateFormData({ interests: selectedInterests });
      console.log("Step 5 Data Updated:", { ...formData, interests: selectedInterests });
      router.push("RegistrationPage6");
    }
  };

  // 9. handleSubmit now just manages the alert
  const handleSubmit = () => {
    if (selectedInterests.length < 1) {
      Alert.alert(
        "Are you sure?",
        "Adding interests helps you match. Are you sure you want to continue?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Yes, continue", onPress: submitData }, // Calls the new submit function
        ]
      );
    } else {
      submitData(); // Call submit function directly
    }
  };

  // 10. Update skip button to be "Cancel" in update mode
  const handleSkipOrCancel = () => {
    if (isUpdateMode) {
      router.back(); // Just go back
    } else {
      // Original skip logic
      updateFormData({ interests: [] });
      router.push("RegistrationPage6");
    }
  };

  // Helper component (unchanged)
  const InterestPill = ({ item, selected, onSelect }) => (
    <TouchableOpacity
      style={[styles.pill, selected && styles.pillSelected]}
      onPress={onSelect}
      disabled={isLoading} // Disable pill presses while loading
    >
      <Text style={styles.pillEmoji}>{item.emoji}</Text>
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
        {item.label}
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
          {/* 11. Update Title based on mode */}
          <Text style={styles.title}>
            {isUpdateMode
              ? "Update your interests"
              : "Choose 5 things you're really into"}
          </Text>
          <Text style={styles.subtitle}>
            You can select up to 5 interests for your profile.
          </Text>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Search color="#666" size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="What are you into?"
              value={searchQuery}
              onChangeText={setSearchQuery}
              editable={!isLoading} // Disable search while loading
            />
          </View>

          <Text style={styles.suggestionTitle}>You might like...</Text>

          {/* Interests List */}
          <View style={styles.pillContainer}>
            {filteredInterests.map((item) => (
              <InterestPill
                key={item.slug}
                item={item}
                selected={selectedInterests.includes(item.slug)}
                onSelect={() => handleSelectInterest(item.slug)}
              />
            ))}
          </View>
        </ScrollView>

        {/* 12. Update Footer UI */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSkipOrCancel} disabled={isLoading}>
            <Text style={styles.skipButton}>
              {isUpdateMode ? "Cancel" : "Skip"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.counterText}>
            {selectedInterests.length}/5 selected
          </Text>
          <TouchableOpacity
            style={[
              styles.nextButton,
              (selectedInterests.length > 5 || isLoading) && styles.nextButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={selectedInterests.length > 5 || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : isUpdateMode ? (
              <CheckIcon />
            ) : (
              <ArrowIcon />
            )}
          </TouchableOpacity>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Styles (unchanged)
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
    paddingBottom: 100,
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
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  searchBar: {
    width: "100%",
    height: 50,
    backgroundColor: "#f0f0f0",
    borderRadius: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  pillContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
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
  pillEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  pillText: {
    fontSize: 14,
    color: "#333",
  },
  pillTextSelected: {
    color: "#E91E63",
    fontWeight: "bold",
  },
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
  counterText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  nextButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E91E63",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  nextButtonDisabled: {
    backgroundColor: "#B0B0B0",
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

export default RegistrationPage5;