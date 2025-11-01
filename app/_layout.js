import { Stack, useRouter } from "expo-router";

import { AuthContextProvider, useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import Toast from "react-native-toast-message";

const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("VALUE OF ISAUTH", isAuthenticated +" "+ typeof isAuthenticated);

    if (typeof isAuthenticated == "undefined") return;
    else if (isAuthenticated) {
      router.replace("SwipePage");
    } else if (isAuthenticated == false) {
      router.replace("EnterPhoneNumber");
    }
  }, [isAuthenticated]);

  return <Stack screenOptions={{ headerShown: false }} />;
};

export default function RootLayout() {
  return (
    <AuthContextProvider>
      <MainLayout />
      <Toast/>
    </AuthContextProvider>
  );
}
