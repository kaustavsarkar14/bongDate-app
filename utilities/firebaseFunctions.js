import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase.config";

export const uploadImageToFirebase = async (uri) => {
  try {
    // Convert local file (photo) to blob
    const blob = await (await fetch(uri)).blob();

    // Create a unique path in Firebase Storage
    const filename = `photos/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);

    // Upload the blob
    await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log("✅ Download URL:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("❌ Upload error:", error);
    return null;
  }
};

export const uploadAudioToFirebase = async (uri) => {
  try {
    // Convert local file (audio) to a blob
    const blob = await (await fetch(uri)).blob();

    // Create a unique path in Firebase Storage
    const filename = `audios/${Date.now()}.m4a`; // .m4a is common for Expo Audio
    const storageRef = ref(storage, filename);

    // Upload the blob
    await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log("✅ Audio Download URL:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("❌ Audio Upload Error:", error);
    return null;
  }
};
