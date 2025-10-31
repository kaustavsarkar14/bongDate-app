import { ActivityIndicator, Text, View } from "react-native";

export default function StartUpPage() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text className="text-red-500">
        Edit app/index.tsx to edit this screen.
      </Text>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
}
