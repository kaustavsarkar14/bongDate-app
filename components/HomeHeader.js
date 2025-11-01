import { StyleSheet, Text, View, Platform, TouchableOpacity } from "react-native";
import React from "react";
// react-native-safe-area-context is better for headers as it gives more control
import { SafeAreaView } from "react-native-safe-area-context";
// Import icons (included with Expo)
import { Ionicons } from "@expo/vector-icons"; // Removed MaterialCommunityIcons
import Toast from "react-native-toast-message";

const HomeHeader = () => {
  const handleNotificationPress = () => {
    Toast.show({
      type: 'success', // Can be 'success', 'error', 'info'
      text1: 'Notification Clicked',
      text2: 'Your changes have been updated successfully.'
    });
  }
  return (
    // Use edges to only apply padding to the top (inside the safe area)
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.headerContainer}>
        {/* Left Side: Title */}
        <Text style={styles.title}>BongDate</Text>

        {/* Right Side: Icon */}
        <TouchableOpacity style={styles.iconsContainer} onPress={handleNotificationPress}>
          <Ionicons name="notifications-outline" size={26} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#E91E63", // Your pink theme color
    // --- Correct Shadow for iOS ---
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    // --- Correct Shadow for Android ---
    elevation: 5,
    borderBottomEndRadius: 10, 
    borderBottomStartRadius: 10,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between", // Puts title left, icons right
    alignItems: "center",
    height: 60, // Standard header height
    paddingHorizontal: 16, // Padding on the sides
  },
  title: {
    color: "#FFFFFF", // White text for contrast
    fontSize: 22,
    fontWeight: "bold",
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  // The 'icon' style with marginLeft was removed as it's no longer needed
});

