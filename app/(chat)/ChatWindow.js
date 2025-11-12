import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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
  // --- 1. SIMPLIFIED PARAMS ---
  const { otherUserId } = useLocalSearchParams();
  // --- END MODIFICATION ---

  const [otherUsername, setOtherUsername] = useState("Loading...");
  const { user, getUser } = useAuth();
  const [messages, setMessages] = useState([]);

  // --- 2. NEW STATE for profile requests ---
  const [profileRequestByUser, setProfileRequestByUser] = useState(null);
  const [profileRequestByOtherUser, setProfileRequestByOtherUser] =
    useState(null);
  // --- END MODIFICATION ---

  const inputTextRef = useRef("");
  const inputComponentRef = useRef(null);
  const flatListRef = useRef();

  const setUserDetails = async () => {
    const otherUserData = await getUser(otherUserId);
    setOtherUsername(otherUserData.name);
  };

  // --- 3. MODIFIED useEffect ---
  useEffect(() => {
    const chatId = getChatIdFromUserIds(user.uid, otherUserId);
    const docRef = doc(db, "chats", chatId);

    // --- Listener for the MAIN CHAT DOC (to get profile status) ---
    const unsubChatDoc = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const chatData = doc.data();
        if (chatData.users) {
          // Find and set status for the current user
          const userStatus = chatData.users.find(
            (usr) => usr.uid == user.uid
          )?.profileUnlockRequest;
          setProfileRequestByUser(userStatus);

          // Find and set status for the other user
          const otherUserStatus = chatData.users.find(
            (usr) => usr.uid == otherUserId
          )?.profileUnlockRequest;
          setProfileRequestByOtherUser(otherUserStatus);
        }
      }
    });

    // --- Listener for MESSAGES (unchanged) ---
    const messageRef = collection(docRef, "messages");
    const q = query(messageRef, orderBy("timestamp", "asc"));
    const unsubMessages = onSnapshot(q, (snapshot) => {
      let allMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(allMessages);
    });

    setUserDetails();

    // Return cleanup function for BOTH listeners
    return () => {
      unsubChatDoc();
      unsubMessages();
    };
  }, [user.uid, otherUserId]); // Add dependencies
  // --- END MODIFICATION ---

  const handleSend = async () => {
    const messageText = inputTextRef.current.trim();
    if (!messageText) return;
    inputTextRef.current = "";
    inputComponentRef.current?.clear();

    try {
      const docRef = doc(
        db,
        "chats",
        getChatIdFromUserIds(user.uid, otherUserId)
      );
      const messageRef = collection(docRef, "messages");
      await addDoc(messageRef, {
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
      Toast.show({ type: "error", text1: "Error sending message" });
    }
  };

  const renderMessage = ({ item: msg }) => (
    <View
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
      {/* --- 4. UPDATED PROPS --- */}
      <ChatWindowHeader
        otherUsername={otherUsername}
        otherUserId={otherUserId}
        profileUnlockRequestByUser={profileRequestByUser}
        profileUnlockRequestByOtherUser={profileRequestByOtherUser}
      />
      {/* --- END MODIFICATION --- */}

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

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputComponentRef}
          defaultValue=""
          onChangeText={(text) => (inputTextRef.current = text)}
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