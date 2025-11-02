import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { db } from "../../firebase.config";
import { collection, getDocs } from "firebase/firestore";

const SwipePage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const userList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <View>
      <Text>SwipePage</Text>
      {users.map((user) => (
        <Text key={user.uid}>{user.name}</Text>
      ))}
    </View>
  );
};

export default SwipePage;
