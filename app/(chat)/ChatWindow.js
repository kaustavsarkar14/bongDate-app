import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
  setDoc,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useLocalSearchParams } from "expo-router";

const ChatWindow = () => {
  const otherUserId = useLocalSearchParams().uid;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);

  const [inputText, setInputText] = useState("");
  const scrollViewRef = useRef();

  useEffect(() => {
    const docRef = doc(
      db,
      "chats",
      getChatIdFromUserIds(user.uid, otherUserId)
      // "rgYIZvaACROB9WlcwbnryyXsQ0i2uTMFzDqj3GXuZWXpj8kc8DSoNG93"
    );

    const messageRef = collection(docRef, "messages");
    const q = query(messageRef, orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      let allMessages = snapshot.docs.map((doc) => doc.data());
      setMessages(allMessages);
    });
    return unsub;
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    setInputText("");

    try {
      const docRef = doc(
        db,
        "chats",
        getChatIdFromUserIds(user.uid, otherUserId)
        // "rgYIZvaACROB9WlcwbnryyXsQ0i2uTMFzDqj3GXuZWXpj8kc8DSoNG93"
      );

      const messageRef = collection(docRef, "messages");
      const newDoc = await addDoc(messageRef, {
        userId: user.uid,
        message: inputText,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.log(error);
      Toast.show({
        type: "error",
        text1: "Error sending message",
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 80}
    >
      {/* Header */}
      <ChatWindowHeader />

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.length > 0 && messages.map((msg) => (
          <View
            key={msg.uid}
            style={[
              styles.messageBubble,
              msg.userId === user.uid ? styles.myMessage : styles.otherMessage,
            ]}
          >
            <Text style={styles.messageText}>{msg.message}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Input Section */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
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
