import { Tabs } from "expo-router";
import HomeHeader from "../../components/HomeHeader";

const _layout = () => {
  return (
    <Tabs screenOptions={{ header: () => <HomeHeader /> }} >
      <Tabs.Screen name="ChatPage" />
      <Tabs.Screen name="SwipePage" />
      <Tabs.Screen name="ProfilePage" />
    </Tabs>
  );
};

export default _layout;
