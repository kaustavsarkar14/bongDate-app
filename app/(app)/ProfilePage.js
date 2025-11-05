import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Phone, LogOut } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";

const ProfilePage = () => {
  const { logout, user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Image source={{ uri: "" }} style={styles.profileImage} />
        <View style={styles.infoContainer}>
          <Text style={styles.nameText}>{user?.name}</Text>
          <View style={styles.phoneContainer}>
            <Phone color="#888" size={16} />
            <Text style={styles.phoneText}>{user?.phoneNumber}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <LogOut color="#D90429" size={20} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EEEEEE",
    marginRight: 20,
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  phoneText: {
    fontSize: 16,
    color: "#555",
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F0",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  logoutText: {
    fontSize: 16,
    color: "#D90429",
    marginLeft: 10,
    fontWeight: "500",
  },
});

export default ProfilePage;
