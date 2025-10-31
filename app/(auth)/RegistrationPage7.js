import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image, // 1. Import Image
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationDataContext";
import { ChevronRight, Plus, X } from "lucide-react-native"; // 2. Import new icons
import * as ImagePicker from "expo-image-picker"; // 3. Import ImagePicker

// Next button icon
const ArrowIcon = () => (
  <View style={styles.arrowIcon}>
    <ChevronRight color="#fff" size={28} strokeWidth={3} />
  </View>
);

const RegistrationPage7 = () => {
  const { formData, updateFormData } = useRegistration();
  // Store photos as an array of URIs. Use null as a placeholder.
  const [photos, setPhotos] = useState(formData.photoURIs || [null, null, null, null, null, null]);
  const router = useRouter();

  const handlePickImage = async (index) => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please grant permission to access your photo library."
      );
      return;
    }

    // Launch image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4], // Common portrait aspect ratio
      quality: 0.7,
    });

    if (!result.canceled) {
      // Create a new array, update the specific index
      const newPhotos = [...photos];
      newPhotos[index] = result.assets[0].uri;
      setPhotos(newPhotos);
    }
  };

  const handleRemoveImage = (index) => {
    const newPhotos = [...photos];
    newPhotos[index] = null;
    setPhotos(newPhotos);
  };

  // Get count of non-null photos
  const photoCount = photos.filter(Boolean).length;

  const handleNext = () => {
    if (photoCount < 2) {
      Alert.alert(
        "Add more photos",
        "Please add at least 2 photos to continue."
      );
      return;
    }

    // Save the array of photo URIs (filtering out nulls)
    const validPhotos = photos.filter(Boolean);
    updateFormData({ photoURIs: validPhotos });

    console.log("Step 7 Data Updated:", { ...formData, photoURIs: validPhotos });
    // Navigate to the next step
    router.push("FaceVerification"); // Next: ID verification
  };

  const handleSkip = () => {
    // This is a blind date app, so skipping photos might be an option
    // Or, you could show an alert confirming.
    updateFormData({ photoURIs: [] });
    router.push("FaceVerification");
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
          <Text style={styles.title}>Add your photos</Text>
          <Text style={styles.subtitle}>
            Add at least 2 photos to continue. These will be blurred until you
            match.
          </Text>

          {/* Photo Grid */}
          <View style={styles.gridContainer}>
            {photos.map((uri, index) => (
              <TouchableOpacity
                key={index}
                style={styles.photoSlot}
                onPress={() => handlePickImage(index)}
              >
                {uri ? (
                  <>
                    <Image source={{ uri }} style={styles.photo} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <X color="#fff" size={16} strokeWidth={3} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <Plus color="#E91E63" size={30} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipButton}>Skip</Text>
          </TouchableOpacity>
          <Text style={styles.counterText}>{photoCount}/6 selected</Text>
          <TouchableOpacity
            style={[styles.nextButton, photoCount < 2 && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={photoCount < 2}
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
  // Grid
  gridContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  photoSlot: {
    width: "48%", // Two columns with some space
    aspectRatio: 3 / 4, // Portrait aspect ratio
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 8, // Slightly less than slot to show border
  },
  removeButton: {
    position: "absolute",
    bottom: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E91E63",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 5,
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
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 30,
    color: "#333",
  },
});

export default RegistrationPage7;
