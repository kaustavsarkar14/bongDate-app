import { createContext, useContext, useState } from "react";

// 1. Create the context
export const RegistrationContext = createContext();

// Define the initial empty state for the form
// const initialState = {
//   phoneNumber: "",
//   name: "",
//   birthdate: "",
//   gender: "",
//   oppositeGenderPreference: [],
//   intentions: [],
//   interests: [],
//   religion: "",
//   politics: "",
//   faceVerified: false,
//   faceVerificationPhotoURL: "",
//   audioIntroUrl: "",
// };
const initialState = null;
export const RegistrationContextProvider = ({ children }) => {
  const [formData, setFormData] = useState(initialState);

  // 4. Create a function to update the form data
  // This function safely merges new data with the existing data
  const updateFormData = (newData) => {
    setFormData((prevData) => {
      const updatedData = { ...prevData, ...newData };
      console.log("Registration data updated:", updatedData);
      return updatedData;
    });
  };

  // 5. Create a function to clear the form data after registration
  const clearRegistrationData = () => {
    setFormData(initialState);
    console.log("Registration data cleared.");
  };

  return (
    <RegistrationContext.Provider
      value={{ formData, updateFormData, clearRegistrationData }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};

// 6. Create the custom hook to easily use the context
export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (context === undefined) {
    throw new Error(
      "useRegistration must be used within a RegistrationContextProvider"
    );
  }
  return context;
};
