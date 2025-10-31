import { Stack } from 'expo-router';
import { RegistrationContextProvider } from '../../context/RegistrationDataContext';


export default function AuthLayout() {
  return (
    <RegistrationContextProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </RegistrationContextProvider>
  );
}