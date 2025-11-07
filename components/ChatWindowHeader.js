import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, EllipsisVertical } from "lucide-react-native";
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuProvider,
  MenuTrigger,
} from "react-native-popup-menu";
import { Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.config";
import { getChatIdFromUserIds } from "../utilities/functions";

const ChatWindowHeader = ({
  otherUsername,
  otherUserId,
  photoURL,
  profileUnlockRequestByUser,
  profileUnlockRequestByOtherUser,
}) => {
  const router = useRouter();
  const { user } = useAuth();

  const handleProfilePress = () => {
    if (
      profileUnlockRequestByUser === "true" &&
      profileUnlockRequestByOtherUser === "true"
    ) {
      router.push({
        pathname: "UserProfile",
        params: {
          userId: otherUserId,
        },
      });
    } else {
      requestProfileUnlockConfirmation();
    }
  };

  const requestProfileUnlockConfirmation = () => {
    Alert.alert(
      "Confirm",
      "Do you want to request to unlock this profile?",
      [
        {
          text: "No",
          onPress: () => console.log("User pressed No"),
          style: "cancel", // makes it look like a cancel button
        },
        {
          text: "Yes",
          onPress: () => requestProfileUnlock(),
        },
      ],
      { cancelable: true } // user can dismiss by tapping outside
    );
  };

  const requestProfileUnlock = async () => {
    try {
      const chatRef = doc(
        db,
        "chats",
        getChatIdFromUserIds(user.uid, otherUserId)
      );
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        console.log("Chat not found");
        return;
      }

      const chatData = chatSnap.data();
      const usersArray = chatData.users || [];

      const updatedUsers = usersArray.map((usr) => {
        if (usr.uid == user.uid) {
          return { ...usr, profileUnlockRequest: true };
        }
        return usr;
      });

      await updateDoc(chatRef, { users: updatedUsers });
    } catch (error) {
      console.error("Error updating profile unlock:", error);
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
          <View style={styles.leftContainer}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={26} color="black" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleProfilePress}
            >
              <Image
                source={{
                  uri:
                    photoURL ||
                    "https://ps.w.org/shortpixel-image-optimiser/assets/icon-256x256.gif?rev=3245715",
                }}
                style={styles.profileImage}
              />
              <Text style={styles.name} numberOfLines={1}>
                {otherUsername}
              </Text>
            </TouchableOpacity>
          </View>
        ),
        headerRight: () => (
          <Menu>
            <MenuTrigger>
              <EllipsisVertical size={24} color="black" />
            </MenuTrigger>
            <MenuOptions>
              <MenuOption
                onSelect={() => handleProfilePress()}
                disabled={
                  profileUnlockRequestByUser === "true" &&
                  profileUnlockRequestByOtherUser === "true"
                }
                text="Request Profile Reveal"
              />
              {/* <MenuOption onSelect={() => alert("Delete")}>
                <Text style={{ color: "red" }}>Delete</Text>
              </MenuOption> */}
              {/* <MenuOption
                onSelect={() => alert("Not called")}
                disabled
                text="Disabled"
              /> */}
            </MenuOptions>
          </Menu>
        ),
      }}
    />
  );
};

export default ChatWindowHeader;

const styles = StyleSheet.create({
  leftContainer: {
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
    flexShrink: 1,
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
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
    flexShrink: 1,
  },
});
