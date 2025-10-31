import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TextInput, // 1. Import TextInput for search
} from "react-native";
import React, { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationDataContext";
import { ChevronRight, Search } from "lucide-react-native"; // 2. Import Search icon

// --- Mock Data for Interests ---
// In a real app, you'd fetch this from a database
const ALL_INTERESTS = [
  { slug: "museums", label: "Museums & galleries", emoji: "🏛️" },
  { slug: "skiing", label: "Skiing", emoji: "⛷️" },
  { slug: "crafts", label: "Crafts", emoji: "✍️" },
  { slug: "country", label: "Country", emoji: "🎵" },
  { slug: "coffee", label: "Coffee", emoji: "☕" },
  { slug: "gardening", label: "Gardening", emoji: "🌱" },
  { slug: "foodie", label: "Foodie", emoji: "🍔" },
  { slug: "lgbtq-rights", label: "LGBTQ+ rights", emoji: "🏳️‍🌈" },
  { slug: "tennis", label: "Tennis", emoji: "🎾" },
  { slug: "writing", label: "Writing", emoji: "📝" },
  { slug: "art", label: "Art", emoji: "🎨" },
  { slug: "exploring", label: "Exploring new cities", emoji: "🏙️" },
  { slug: "horror", label: "Horror", emoji: "👻" },
  { slug: "vegetarian", label: "Vegetarian", emoji: "🥦" },
  { slug: "camping", label: "Camping", emoji: "🏕️" },
  { slug: "cats", label: "Cats", emoji: "🐈" },
  { slug: "hiking", label: "Hiking trips", emoji: "⛰️" },
  { slug: "concerts", label: "Concerts", emoji: "🎤" },
  { slug: "wine", label: "Wine", emoji: "🍷" },
  { slug: "festivals", label: "Festivals", emoji: "🎉" },
  { slug: "baking", label: "Baking", emoji: "🍰" },
  { slug: "dancing", label: "Dancing", emoji: "💃" },
  { slug: "yoga", label: "Yoga", emoji: "🧘" },
  { slug: "dogs", label: "Dogs", emoji: "🐕" },
  { slug: "rnb", label: "R&B", emoji: "🎶" },
  // Add more as needed
];
// ------------------------------

// Next button icon
const ArrowIcon = () => (
  <View style={styles.arrowIcon}>
    <ChevronRight color="#fff" size={28} strokeWidth={3} />
  </View>
);

const RegistrationPage5 = () => {
  const { formData, updateFormData } = useRegistration();
  const [selectedInterests, setSelectedInterests] = useState(
    formData.interests || []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Filter interests based on search query
  const filteredInterests = useMemo(() => {
    if (!searchQuery) {
      return ALL_INTERESTS; // Show all if search is empty
    }
    return ALL_INTERESTS.filter((interest) =>
      interest.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelectInterest = (slug) => {
    let newInterests;
    if (selectedInterests.includes(slug)) {
      // Deselect
      newInterests = selectedInterests.filter((item) => item !== slug);
    } else {
      // Select, but check limit
      if (selectedInterests.length >= 5) {
        Alert.alert("Limit Reached", "You can choose a maximum of 5 interests.");
        return;
      }
      newInterests = [...selectedInterests, slug];
    }
    setSelectedInterests(newInterests);
  };

  const handleNext = () => {
    // Unlike before, we allow 0 interests (user can skip)
    // But you could enforce a minimum here if desired
    if (selectedInterests.length < 1) {
       Alert.alert(
        "Are you sure?",
        "Adding interests helps you match. Are you sure you want to continue?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Yes, continue", onPress: proceedToNext },
        ]
      );
    } else {
      proceedToNext();
    }
  };
  
  const proceedToNext = () => {
    updateFormData({ interests: selectedInterests });
    console.log("Step 5 Data Updated:", { ...formData, interests: selectedInterests });
    // Navigate to the next step
    router.push("RegistrationPage6"); // Next: ID verification
  }

  const handleSkip = () => {
    // Save an empty array and proceed
    updateFormData({ interests: [] });
    router.push("RegistrationPage6"); // Next: ID verification
  };

  // Helper component for the interest "pills"
  const InterestPill = ({ item, selected, onSelect }) => (
    <TouchableOpacity
      style={[styles.pill, selected && styles.pillSelected]}
      onPress={onSelect}
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
          <Text style={styles.title}>Choose 5 things you're really into</Text>
          <Text style={styles.subtitle}>
            Proud foodie or big on bouldering? Add interests to your profile.
          </Text>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Search color="#666" size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="What are you into?"
              value={searchQuery}
              onChangeText={setSearchQuery}
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

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipButton}>Skip</Text>
          </TouchableOpacity>
          <Text style={styles.counterText}>
            {selectedInterests.length}/5 selected
          </Text>
          <TouchableOpacity 
            style={[styles.nextButton, selectedInterests.length > 5 && styles.nextButtonDisabled]} 
            onPress={handleNext}
            disabled={selectedInterests.length > 5}
          >
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
    // Use padding instead of justify-center to allow scrolling from top
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
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  // Search Bar
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
  // Suggestion Title
  suggestionTitle: {
    fontSize: 18,
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
  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 90, // Taller footer
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20, // Padding for safe area
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
    zIndex: 1, // Ensure it's above content
  },
  backButtonText: {
    fontSize: 30,
    color: "#333",
  },
});

export default RegistrationPage5;
