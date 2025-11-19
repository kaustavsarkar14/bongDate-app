// VideoModal.js
import React, { useEffect, useState } from "react";
import { Modal, View, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { X } from "lucide-react-native";

const VideoModal = ({ visible, videoURL, onClose }) => {
  const [isReady, setIsReady] = useState(false);

  // create player
  const player = useVideoPlayer(videoURL, (playerInstance) => {
    playerInstance.pause();
  });

  useEffect(() => {
    if (!visible) {
      player.pause();
      setIsReady(false);
      return;
    }

    const readyCheck = setInterval(() => {
      if (player.status === "readyToPlay") {
        clearInterval(readyCheck);
        setIsReady(true);
        player.play();
      }
    }, 80);

    return () => clearInterval(readyCheck);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={28} color="#fff" />
          </TouchableOpacity>

          {!isReady && (
            <ActivityIndicator size="large" color="#fff" style={styles.loader} />
          )}

          <VideoView
            style={styles.video}
            player={player}
            nativeControls
            allowsFullscreen={false} // prevent fullscreen default
          />
        </View>
      </View>
    </Modal>
  );
};

export default VideoModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    height: "70%",
    backgroundColor: "#000",
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  loader: {
    position: "absolute",
    zIndex: 10,
  },
  closeBtn: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 20,
  },
});
