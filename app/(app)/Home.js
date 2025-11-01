import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

const Home = () => {
  const { logout, user } = useAuth();
  console.log("this is the user");
  console.log(user);
  return (
    <SafeAreaView>
      <Text>Home</Text>
      <TouchableOpacity onPress={logout}>
        <Text>Log out</Text>
        <Text>{user?.uid ? user.uid : "loading..."}</Text>
        <Text>{user?.name ? user.name : "loading..."}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Home;
