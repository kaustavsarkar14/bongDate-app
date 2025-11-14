import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions, // Used to get screen width
} from "react-native";
import { Video } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

// Get the full width of the device's screen
const { width } = Dimensions.get("window");

export default function App() {
  const router = useRouter();
  const handleRecordPress = () => {
    router.push('/RecordVideo')
    // Example: You might navigate to a new Camera screen
  };

  // --- Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* --- Banner Image --- */}
      {/* Using a placeholder image. Replace 'uri' with your image link. */}
      <Image
        source={{
          uri: "https://firebasestorage.googleapis.com/v0/b/instagram-clone-kaustav.appspot.com/o/photos%2Fapply%20now%20banner.jpg?alt=media&token=60ffd33f-8b17-498e-955f-78be3c384736",
        }}
        style={styles.bannerImage}
        onError={(e) => {
          // Fallback isn't as simple as web, but you can manage state
          // to show a default image source (e.g., require('./local-fallback.png'))
          console.log("Error loading image", e.nativeEvent.error);
        }}
      />

      {/* --- Content Container --- */}
      <View style={styles.contentContainer}>
        {/* --- Big Text --- */}
        <Text style={styles.title}>Apply for BongDate</Text>

        {/* --- Small Text --- */}
        <Text style={styles.subtitle}>
          Record a 60-second video of yourself to apply.
        </Text>

        {/* --- Record Button (CTA) --- */}
        <TouchableOpacity
          onPress={handleRecordPress}
          style={styles.recordButton}
          activeOpacity={0.8} // Controls fade effect on press
        >
          <Video color="#FFFFFF" size={24} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Record Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- Stylesheet ---
// This is React Native's way of styling, similar to CSS.
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB", // equiv. bg-gray-50
  },
  bannerImage: {
    width: "100%",
    height: 256, // equiv. h-64
    resizeMode: "cover",
  },
  contentContainer: {
    flex: 1, // Takes up remaining space
    alignItems: "center",
    justifyContent: "center", // Centers content vertically in the remaining space
    padding: 24,
    marginTop: -10, // Pulls content up slightly over the image (optional nice effect)
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#F9FAFB", // Match safe area to cover part of the image
  },
  title: {
    fontSize: 36, // equiv. text-4xl
    fontWeight: "bold",
    color: "#1F2937", // equiv. text-gray-800
    marginBottom: 12, // equiv. mb-3
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18, // equiv. text-lg
    color: "#4B5563", // equiv. text-gray-600
    marginBottom: 40, // equiv. mb-10
    maxWidth: 384, // equiv. max-w-md
    textAlign: "center",
  },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32, // equiv. px-8
    paddingVertical: 16, // equiv. py-4
    // Gradients require a library like 'expo-linear-gradient'.
    // Using a solid color as a fallback.
    backgroundColor: "#EF4444", // equiv. to-red-500
    borderRadius: 9999, // equiv. rounded-full

    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,

    // Shadow for Android
    elevation: 8,
  },
  buttonIcon: {
    marginRight: 12, // equiv. mr-3
  },
  buttonText: {
    color: "#FFFFFF", // equiv. text-white
    fontSize: 18, // equiv. text-lg
    fontWeight: "600", // equiv. font-semibold
  },
});
