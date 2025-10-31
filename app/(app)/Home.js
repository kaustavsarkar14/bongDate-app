import { View, Text } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';

const Home = () => {
  return (
    <SafeAreaView>
       <Tabs>
      <TabSlot />
      <TabList>
        <TabTrigger name="home" href="/">
          <Text>Home</Text>
        </TabTrigger>
        <TabTrigger name="article" href="/article">
          <Text>Article</Text>
        </TabTrigger>
      </TabList>
    </Tabs>
    </SafeAreaView>
  );
};

export default Home;
