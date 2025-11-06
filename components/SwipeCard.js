import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import React from "react";

const SwipeCard = ({ user,replayAudio }) => {
    
  return (
    <View style={styles.card}>
      <Text style={styles.text}>{user.name}</Text>
      <Text>{user.birthdate}</Text>
      <TouchableOpacity onPress={replayAudio} >
        <Text>Replay Audio</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SwipeCard;

const styles = StyleSheet.create({
  card: {
    height: 400,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "blue",
    justifyContent: "center",
    backgroundColor: "#FF94CF",
  },
   text: {
    textAlign: "center",
    fontSize: 50,
    backgroundColor: "transparent",
  },
});
