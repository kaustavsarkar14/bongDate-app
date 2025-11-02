import { doc, getDoc } from "firebase/firestore";
import { FlatList, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import ChatItem from "../../components/ChatItem";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase.config";
import { useRouter } from "expo-router";

const ChatPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const chats = [
    {
      uid: "rgYIZvaACROB9WlcwbnryyXsQ0i2",
      name: "John Wick",
    },
    {
      uid: "uTMFzDqj3GXuZWXpj8kc8DSoNG93",
      name: "Kaustav ",
    },
    {
      uid: 3,
      name: "User 3",
    },
    {
      uid: 4,
      name: "User 4",
    },
  ];

  const openChatWindow = async (item) => {
    router.push({
      pathname: "ChatWindow",
      params: {
        uid: item.uid,
      },
    });
  };

  return (
    <View>
      <Text>ChatPage</Text>
      <FlatList
        data={chats}
        keyExtractor={(chat) => chat.uid}
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
