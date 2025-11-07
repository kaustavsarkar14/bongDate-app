import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  // Import FlatList
  FlatList,
} from "react-native";
import ChatWindowHeader from "../../components/ChatWindowHeader";
import { Send } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useAuth } from "../../context/AuthContext";
import { getChatIdFromUserIds } from "../../utilities/functions";

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useLocalSearchParams } from "expo-router";

const ChatWindow = () => {
  const {
    otherUserId,
    profileUnlockRequestByUser,
    profileUnlockRequestByOtherUser,
  } = useLocalSearchParams();
  const [otherUsername, setOtherUsername] = useState("Loading...");
  const { user, getUser } = useAuth();
  const [messages, setMessages] = useState([]);


  const inputTextRef = useRef("");
  const inputComponentRef = useRef(null);
  const flatListRef = useRef(); // Renamed from scrollViewRef for clarity

  const setUserDetails = async () => {
    const otherUserData = await getUser(otherUserId);
    setOtherUsername(otherUserData.name);
  };

  useEffect(() => {
    const docRef = doc(
      db,
      "chats",
      getChatIdFromUserIds(user.uid, otherUserId)
    );

    const messageRef = collection(docRef, "messages");
    const q = query(messageRef, orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      let allMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(allMessages);
    });

    setUserDetails();
    return unsub;
  }, []);

  const handleSend = async () => {
    const messageText = inputTextRef.current.trim();

    if (!messageText) return;

    // Clear the ref and the input component
    inputTextRef.current = "";
    inputComponentRef.current?.clear();
    // --- Changes End ---

    try {
      const docRef = doc(
        db,
        "chats",
        getChatIdFromUserIds(user.uid, otherUserId)
      );

      const messageRef = collection(docRef, "messages");
      const newDoc = await addDoc(messageRef, {
        userId: user.uid,
        message: messageText,
        timestamp: serverTimestamp(),
      });

      await setDoc(
        docRef,
        {
          lastMessage: {
            text: messageText,
            senderId: user.uid,
            timestamp: serverTimestamp(),
          },
        },
        { merge: true }
      );
    } catch (error) {
      console.log(error);
      Toast.show({
        type: "error",
        text1: "Error sending message",
      });
    }
  };

  const renderMessage = ({ item: msg }) => (
    <View
      key={msg.id} // key is still good practice, though FlatList handles it
      style={[
        styles.messageBubble,
        msg.userId === user.uid ? styles.myMessage : styles.otherMessage,
      ]}
    >
      <Text style={styles.messageText}>{msg.message}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 80}
    >
      <ChatWindowHeader
        otherUsername={otherUsername}
        otherUserId={otherUserId}
        profileUnlockRequestByUser={profileUnlockRequestByUser}
        profileUnlockRequestByOtherUser={profileUnlockRequestByOtherUser}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Section */}
      <View style={styles.inputContainer}>
        <TextInput
          // --- Changes Start ---
          ref={inputComponentRef}
          // Removed `value` prop
          // Set `defaultValue` so it's initially empty
          defaultValue=""
          // Update the ref's current value on change
          onChangeText={(text) => (inputTextRef.current = text)}
          // --- Changes End ---
          style={styles.input}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Send size={26} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatWindow;

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  messagesContainer: {
    flexGrow: 1,
    padding: 10,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 10,
    borderRadius: 12,
    marginVertical: 5,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#EAEAEA",
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },
  inputContainer: {
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    maxHeight: 120,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#E91E63",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
