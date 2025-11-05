import { Tabs } from "expo-router";
import HomeHeader from "../../components/HomeHeader";
import { GalleryVerticalEnd, MessageCircleHeart, UserRound } from "lucide-react-native";

const _layout = () => {
  return (
    <Tabs screenOptions={{ header: () => <HomeHeader /> }}>
      <Tabs.Screen
        name="ChatPage"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => <MessageCircleHeart />,
        }}
      />
      <Tabs.Screen name="SwipePage"  options={{
          title: "Explore",
          tabBarIcon: ({ color }) => <GalleryVerticalEnd />
        }} />
      <Tabs.Screen name="ProfilePage"   options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <UserRound />,
        }} />
    </Tabs>
  );
};

export default _layout;
