import { Stack, useRouter } from "expo-router";
import { AuthContextProvider, useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { MenuProvider } from "react-native-popup-menu";
import { Camera } from "expo-camera"; // Import Camera
import { Alert, BackHandler } from "react-native"; // Import Alert and BackHandler

const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  // State to track permission status: 'pending', 'granted', 'denied'
  const [permissionStatus, setPermissionStatus] = useState("pending");

  // 1. Request permissions on component mount
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // Request camera permission
        const { status: cameraStatus } =
          await Camera.requestCameraPermissionsAsync();
        
        // Request microphone permission
        const { status: microStatus } =
          await Camera.requestMicrophonePermissionsAsync();

        // Update status based on both permissions
        if (cameraStatus === "granted" && microStatus === "granted") {
          setPermissionStatus("granted");
        } else {
          // If either permission is denied, set status to 'denied'
          setPermissionStatus("denied");
        }
      } catch (e) {
        console.error("Error requesting permissions: ", e);
        setPermissionStatus("denied"); // Assume denied on error
      }
    };

    requestPermissions();
  }, []); // Empty dependency array ensures this runs once on mount

  // 2. Handle navigation *after* permissions are checked and auth state is known
  useEffect(() => {
    // Wait until permission check is complete
    if (permissionStatus === "pending") {
      return; // Still checking permissions, do nothing
    }

    // If permissions were denied, show alert and exit
    if (permissionStatus === "denied") {
      Alert.alert(
        "Permissions Required",
        "This app needs Camera and Microphone access to work.",
        [
          {
            text: "Exit App",
            onPress: () => BackHandler.exitApp(), // This will close the app
          },
        ],
        { cancelable: false } // User cannot dismiss the alert
      );
      
      // Note: Programmatically exiting an app (BackHandler.exitApp()) is
      // strongly discouraged on iOS and generally bad practice.
      // A better user experience would be to show a screen
      // guiding the user to enable permissions in their device settings.
      return;
    }

    // If permissions are granted, proceed with auth-based navigation
    if (permissionStatus === "granted") {
      if (typeof isAuthenticated === "undefined") {
        // Auth state is still loading, do nothing
        return;
      } else if (isAuthenticated) {
        // User is authenticated, go to UploadAudio
        router.replace("/Apply");
      } else if (isAuthenticated === false) {
        // User is not authenticated, go to login
        router.replace("EnterPhoneNumber");
      }
    }
  }, [isAuthenticated, permissionStatus, router]); // Re-run when auth or permission status changes

  // Render the layout. While permissions/auth are pending, it will
  // show a blank screen, which is fine for a layout component.
  return <Stack screenOptions={{ headerShown: false }} />;
};

export default function RootLayout() {
  return (
    <AuthContextProvider>
      <MenuProvider>
        <MainLayout />
        <Toast />
      </MenuProvider>
    </AuthContextProvider>
  );
}