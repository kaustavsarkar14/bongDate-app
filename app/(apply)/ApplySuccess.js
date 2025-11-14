import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native'; // modern icon

const ApplySuccess = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Success Circle */}
      <View style={styles.circle}>
        <Check size={50} color="white" />
      </View>

      {/* Message */}
      <Text style={styles.title}>Thank You!</Text>
      <Text style={styles.subtitle}>
        Thanks for applying in BongDate.{"\n"}
        We will get back to you soon.
      </Text>

      {/* Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/SwipePage")}
      >
        <Text style={styles.buttonText}>Go Home</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ApplySuccess;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  circle: {
    height: 120,
    width: 120,
    borderRadius: 60,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    marginTop: 25,
    color: "#333",
  },

  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 26,
  },

  button: {
    backgroundColor: "#FF3366",
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 30,
    marginTop: 40,
    elevation: 5,
  },

  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
