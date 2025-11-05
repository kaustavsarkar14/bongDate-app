import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { FlatList, Text, View } from "react-native";
import ChatItem from "../../components/ChatItem";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase.config";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

const ChatPage = () => {
  const { user, getUser } = useAuth();
  const router = useRouter();

  const [chats, setChats] = useState([]);

  useEffect(() => {
    // reference to "chats" collection
    const chatsRef = collection(db, "chats");

    // setup realtime listener
    const unsubscribe = onSnapshot(chatsRef, (snapshot) => {
      const chatList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log(chatList);
      setChats(chatList);
    });

    // cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const openChatWindow = async (item) => {
    console.log(
      user.uid == item.users[0].uid ? item.users[1].uid : item.users[0].uid
    );
    router.push({
      pathname: "ChatWindow",
      params: {
        otherUserId:
          user.uid == item.users[0].uid ? item.users[1].uid : item.users[0].uid,
        otherUsername: "text",
      },
    });
  };

  return (
    <View>
      <FlatList
        data={chats}
        keyExtractor={(chat) => chat.id}
        renderItem={({ item }) => (
          <ChatItem
            router={router}
            chat={item}
            onPress={() => openChatWindow(item)}
          />
        )}
      />
    </View>
  );
};

export default ChatPage;
