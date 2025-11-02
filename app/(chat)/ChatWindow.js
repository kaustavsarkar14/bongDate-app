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
  const [messages, setMessages] = useState([
    { id: 1, text: "Hey there!", sender: "other" },
    { id: 2, text: "Hi! How are you?", sender: "me" },
    { id: 3, text: "I'm good, just got back from work.", sender: "other" },
    { id: 4, text: "Nice! How was your day?", sender: "me" },
    { id: 5, text: "Pretty hectic but productive. Yours?", sender: "other" },
    { id: 6, text: "Same here. Wrapped up a few pending tasks.", sender: "me" },
    {
      id: 7,
      text: "That's good to hear. Any plans for tonight?",
      sender: "other",
    },
    { id: 8, text: "Maybe just watch a movie and relax.", sender: "me" },
    { id: 9, text: "Sounds like a plan! Any movie in mind?", sender: "other" },
    { id: 10, text: "Thinking of rewatching Inception 😅", sender: "me" },
    { id: 11, text: "Haha, classic choice. Never gets old!", sender: "other" },
    {
      id: 12,
      text: "Exactly! I always notice something new each time.",
      sender: "me",
    },
    {
      id: 13,
      text: "True that. Nolan really knows how to twist your brain 😂",
      sender: "other",
    },
    {
      id: 14,
      text: "Haha totally agree! Anyway, how’s your weekend looking?",
      sender: "me",
    },
    {
      id: 15,
      text: "Pretty chill, might go hiking if the weather’s good.",
      sender: "other",
    },
    { id: 16, text: "That sounds fun! Send me pics if you go!", sender: "me" },
    { id: 17, text: "For sure! You should join next time.", sender: "other" },
    {
      id: 18,
      text: "I’d love to! Haven’t been hiking in months.",
      sender: "me",
    },
    {
      id: 19,
      text: "Then it’s settled. Next weekend, you’re coming 😄",
      sender: "other",
    },
    { id: 20, text: "Deal! Hope I can keep up though 😂", sender: "me" },
    { id: 21, text: "Haha, don’t worry. It’s an easy trail.", sender: "other" },
    { id: 22, text: "Good, because my cardio is tragic 😅", sender: "me" },
    { id: 23, text: "Haha same here, we’ll suffer together!", sender: "other" },
    {
      id: 24,
      text: "At least we’ll get some good views out of it.",
      sender: "me",
    },
    {
      id: 25,
      text: "Absolutely! And maybe some coffee afterward?",
      sender: "other",
    },
    {
      id: 26,
      text: "Yes, coffee is mandatory after any physical activity ☕",
      sender: "me",
    },
    {
      id: 27,
      text: "Agreed! You’re speaking my language now 😂",
      sender: "other",
    },
    {
      id: 28,
      text: "Haha always! Can’t survive without caffeine.",
      sender: "me",
    },
    {
      id: 29,
      text: "Same! Alright, I’ll text you the details later.",
      sender: "other",
    },
    { id: 30, text: "Cool, looking forward to it!", sender: "me" },
  ]);

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
        {messages.map((msg) => (
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
