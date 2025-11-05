import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";

const ChatItem = ({ onPress, chat }) => {
  const { user, getUser } = useAuth();
  const otherUser =
    chat.users[0].uid == user.uid ? chat.users[1] : chat.users[0];
  const [otherUserDetails, setOtherUserDetails] = useState("");

  const fetchOtherDetails = async () => {
    try {
      const userDoc = await getUser(otherUser.uid);
      setOtherUserDetails(userDoc);
    } catch (error) {
      console.log("Error fetching other user details:", error);
    }
  };
  useEffect(() => {
    fetchOtherDetails();
  }, [chat]);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image
        source={{ uri: chat.profileImageUrl }}
        style={styles.profileImage}
      />
      <View style={styles.contentContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.nameText}>{otherUserDetails.name}</Text>
          <Text
            style={[
              styles.messageText,
              {
                color:
                  chat.lastMessage?.senderId == user.uid
                    ? "#000000ff"
                    : "#f411f4ff",
              },
            ]}
            numberOfLines={1}
          >
            {chat.lastMessage?.text || "Say Hello!! 👋"}
          </Text>
        </View>
        <Text style={styles.timeText}>{chat.time}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  profileImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: "#EEEEEE",
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    marginRight: 10,
  },
  nameText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: "#666",
  },
  timeText: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
});

export default ChatItem;
