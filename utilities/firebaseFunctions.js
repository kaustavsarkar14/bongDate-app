import { getDownloadURL, ref, uploadBytes, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "../firebase.config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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

export const uploadVideoToFirebase = (uri, onProgress) => {
  // We return a new Promise to be able to 'await' it in our component
  return new Promise(async (resolve, reject) => {
    try {
      const blob = await (await fetch(uri)).blob();
      const fileExtension = blob.type.split('/')[1];
      const filename = `videos/${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, filename);

      // --- This is the key change ---
      // Use 'uploadBytesResumable' instead of 'uploadBytes'
      const uploadTask = uploadBytesResumable(storageRef, blob);

      // Listen for state changes, errors, and completion
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Get task progress, including bytes-transferred and total-bytes
          const progress = snapshot.bytesTransferred / snapshot.totalBytes;
          
          // Call the onProgress callback with the progress
          onProgress(progress);
        },
        (error) => {
          // Handle unsuccessful uploads
          console.error("Upload task error:", error);
          reject(error); // Reject the promise on error
        },
        async () => {
          // Handle successful uploads on complete
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL); // Resolve the promise with the URL
          } catch (e) {
            reject(e); // Reject if getting the URL fails
          }
        }
      );
    } catch (e) {
      console.error("Error creating blob or ref:", e);
      reject(e);
    }
  });
};

export const saveApplicationToFirestore = async (userId, username, videoUrl) => {
  try {
    await addDoc(collection(db, "applications"), {
      userId: userId,
      username: username,
      videoUrl: videoUrl,
      status: "pending", // You can add a default status
      createdAt: serverTimestamp(),
    });
    console.log("✅ Application saved to Firestore successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error saving application to Firestore: ", error);
    return false;
  }
};