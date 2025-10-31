import { Stack, useRouter } from "expo-router";

import { AuthContextProvider, useAuth } from "../context/AuthContext";
import { useEffect } from "react";

const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  console.log(isAuthenticated);

  useEffect(() => {
    if (typeof isAuthenticated == "undefined") return;
    else if (isAuthenticated) {
      router.replace("Home");
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
    </AuthContextProvider>
  );
}
