import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router"; // Import useRouter
import { ArrowLeft } from "lucide-react-native";

// This logic should be inside your _layout.js file's Stack
const ChatWindowHeader = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  // This function handles navigation to the profile
  const handleProfilePress = () => {
    // Assuming you have the user's ID in params
    if (params.userId) {
      router.push(`/profile/${params.userId}`);
    } else {
      console.log("Cannot navigate: No user ID provided in params");
    }
  };

  return (
    <Stack.Screen
      options={{
        title: "",
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerShadowVisible: false,

        headerLeft: () => (
          <View style={styles.headerLeftContainer}>
            {/* 1. Back Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={26} color="black" />
            </TouchableOpacity>

            {/* 2. Profile Button (Image + Name) */}
            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleProfilePress}
            >
              <Image
                source={{
                  uri:
                    params?.photoURL ||
                    "https://ps.w.org/shortpixel-image-optimiser/assets/icon-256x256.gif?rev=3245715",
                }}
                style={styles.profileImage}
              />
              <Text style={styles.name} numberOfLines={1}>
                {params?.name || "John Doe"}
              </Text>
            </TouchableOpacity>
          </View>
        ),
      }}
    />
  );
};

export default ChatWindowHeader; // This component is your _layout.js default export

const styles = StyleSheet.create({
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  backButton: {
    padding: 10,
    marginLeft: -10,
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1, // Ensures name doesn't push off-screen
    marginLeft: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    marginRight: 12,
  },
  name: {
    color: "#000000", // Changed to black for visibility
    fontSize: 18,
    fontWeight: "bold",
    flexShrink: 1,
  },
});
