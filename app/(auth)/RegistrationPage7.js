import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationDataContext";
import { Check, ChevronRight, Plus, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";

// PRODUCTION: Import Firebase services
import { doc, updateDoc } from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

// PRODUCTION: This function is still used for the *initial registration* flow.
import { uploadImageToFirebase } from "../../utilities/firebaseFunctions";
import { db, storage } from "../../firebase.config";

// Next button icon
const ArrowIcon = () => (
  <View style={styles.arrowIcon}>
    <ChevronRight color="#fff" size={28} strokeWidth={3} />
  </View>
);

// Icon for "Update" mode
const CheckIcon = () => (
  <View style={styles.arrowIcon}>
    <Check color="#fff" size={28} strokeWidth={3} />
  </View>
);

const RegistrationPage7 = () => {
  const { user, setUser } = useAuth(); // Get setUser from context
  const { formData, updateFormData } = useRegistration();
  const router = useRouter();

  // Determine mode based on user's profile data
  const isUpdateMode = user && user.photoURIs;

  // Store the *original* URLs to detect deletions
  const [originalPhotos] = useState(
    user?.photoURIs || formData?.photoURIs || []
  );

  // Initialize state from user data (update) or form data (registration)
  // This logic is correct and handles both sparse and compact arrays.
  const [photos, setPhotos] = useState(() => {
    const source = user?.photoURIs || formData?.photoURIs || [];
    const padded = [...source, ...Array(6 - source.length).fill(null)];
    return padded;
  });

  const [isUploading, setIsUploading] = useState(false);

  const handlePickImage = async (index) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please grant permission to access your photo library."
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });

    if (!result.canceled) {
      const newPhotos = [...photos];
      newPhotos[index] = result.assets[0].uri; // This is a 'file://' URI
      setPhotos(newPhotos);
    }
  };

  const handleRemoveImage = (index) => {
    const newPhotos = [...photos];
    newPhotos[index] = null;
    setPhotos(newPhotos);
  };

  const photoCount = photos.filter(Boolean).length;

  // PRODUCTION: This is the original logic for NEW REGISTRATION
  const handleRegistrationNext = async () => {
    try {
      const uploadPromises = [];
      const finalURLs = [...photos]; // Copy current state (sparse array)

      photos.forEach((uri, index) => {
        if (uri && uri.startsWith("file:")) {
          // This is a new local file that needs uploading
          uploadPromises.push(
            uploadImageToFirebase(uri, index) // Using original function
              .then((downloadURL) => {
                finalURLs[index] = downloadURL; // Correctly maintains position
              })
          );
        }
      });

      await Promise.all(uploadPromises);
      
      // <-- FIX: REMOVED the .filter(Boolean) line
      // const cleanURLs = finalURLs.filter(Boolean); // <-- OLD BUGGY LINE

      // <-- FIX: Save the full sparse array (finalURLs) to preserve positions
      console.log("Uploaded URLs (Registration):", finalURLs);
      updateFormData({ ...formData, photoURIs: finalURLs });
      router.push("FaceVerification");
    } catch (error) {
      console.error("Registration upload failed:", error);
      Alert.alert(
        "Upload Failed",
        "There was an error uploading your photos. Please try again."
      );
    }
  };

  // PRODUCTION: This is the new, complete logic for UPDATING A PROFILE
  const handleUpdateProfile = async () => {
    if (!user || !user.uid) {
      Alert.alert("Error", "You must be logged in to update your profile.");
      return;
    }

    try {
      // --- 1. Upload new files ---
      const uploadPromises = photos.map(async (uri, index) => {
        if (uri && uri.startsWith("file:")) {
          // ... (upload logic is correct)
          console.log(`Uploading new file for slot ${index}...`);
          const response = await fetch(uri);
          const blob = await response.blob();
          const fileRef = ref(storage, `users/${user.uid}/photo_${index}.jpg`);
          const uploadTask = uploadBytesResumable(fileRef, blob);

          return new Promise((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              null,
              (error) => {
                console.error("Upload failed for slot", index, error);
                reject(error);
              },
              async () => {
                const downloadURL = await getDownloadURL(
                  uploadTask.snapshot.ref
                );
                resolve(downloadURL);
              }
            );
          });
        } else {
          return uri; // Keeps 'http://' URL or 'null'
        }
      });

      // <-- FIX: This is now our final sparse array, do not filter it yet.
      const allFinalURLs = await Promise.all(uploadPromises);
      // const cleanFinalURLs = allFinalURLs.filter(Boolean); // <-- OLD BUGGY LINE

      // --- 2. Delete removed files ---
      // We can create temporary *compact* sets for comparison
      const originalUrlsSet = new Set(originalPhotos.filter(Boolean));
      // <-- FIX: Create a compact set from the new sparse array for comparison
      const finalUrlsSet = new Set(allFinalURLs.filter(Boolean)); 
      const deletePromises = [];

      originalUrlsSet.forEach((url) => {
        if (!finalUrlsSet.has(url)) {
          // This URL was removed. Delete it from Storage.
          console.log("Deleting old photo:", url);
          try {
            const deleteRef = ref(storage, url); // Get ref from URL
            deletePromises.push(deleteObject(deleteRef));
          } catch (error) {
            console.warn("Could not create delete ref for:", url, error);
          }
        }
      });

      await Promise.all(deletePromises);

      // --- 3. Update Firestore Document ---
      // <-- FIX: Save the full sparse array (allFinalURLs)
      console.log("Updating user profile with new URLs:", allFinalURLs);
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        photoURIs: allFinalURLs, 
      });

      // --- 4. Update local AuthContext user state ---
      if (setUser) {
        setUser({
          ...user,
          // <-- FIX: Update local state with the full sparse array
          photoURIs: allFinalURLs,
        });
      } else {
        console.warn(
          "AuthContext does not provide 'setUser'. Local user state might be stale."
        );
      }

      Alert.alert("Profile Updated", "Your photos have been saved.");
      router.push("ProfilePage");
    } catch (error)
    {
      console.error("Profile update failed:", error);
      Alert.alert(
        "Update Failed",
        "There was an error updating your photos. Please try again."
      );
    }
  };

  // Main submit handler
  const handleSubmit = async () => {
    if (photoCount < 3) {
      Alert.alert(
        "Add more photos",
        "Please add at least 3 photos to continue."
      );
      return;
    }

    setIsUploading(true);
    if (isUpdateMode) {
      await handleUpdateProfile();
    } else {
      await handleRegistrationNext();
    }
    setIsUploading(false);
  };

  // Skip/Back logic
  const handleSkipOrBack = () => {
    if (isUpdateMode) {
      router.back(); // In update mode, "Skip" is "Cancel"
    } else {
      // <-- FIX: Also save a sparse array here if skipping
      updateFormData({ photoURIs: Array(6).fill(null) }); 
      router.push("FaceVerification");
    }
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
          {/* ... (UI code is unchanged) ... */}
          <Text style={styles.title}>
            {isUpdateMode ? "Update your photos" : "Add your photos"}
          </Text>
          <Text style={styles.subtitle}>
            Add at least 3 photos.
            {!isUpdateMode && " These will be blurred until you match."}
          </Text>
          <Text style={styles.noteText}>
            Note that the first selected image will be used as your profile
            picture.
          </Text>

          {/* Photo Grid */}
          <View style={styles.gridContainer}>
            {photos.map((uri, index) => (
              <TouchableOpacity
                key={index}
                style={styles.photoSlot}
                onPress={() => handlePickImage(index)}
                disabled={isUploading}
              >
                {uri ? (
                  <>
                    <Image source={{ uri }} style={styles.photo} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveImage(index)}
                      disabled={isUploading}
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
          {/* ... (UI code is unchanged) ... */}
          <TouchableOpacity onPress={handleSkipOrBack} disabled={isUploading}>
            <Text style={styles.skipButton}>
              {isUpdateMode ? "Cancel" : "Skip"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.counterText}>{photoCount}/6 selected</Text>

          <TouchableOpacity
            style={[
              styles.nextButton,
              (photoCount < 3 || isUploading) && styles.nextButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={photoCount < 3 || isUploading}
          >
            {isUploading ? (
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
          disabled={isUploading}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Styles remain unchanged
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
    color: "#363636ff",
    textAlign: "center",
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  noteText: {
    fontSize: 12,
    color: "#666666ff",
    textAlign: "center",
    marginBottom: 10,
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