// app/components/SwipeCard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { User, RotateCcw } from "lucide-react-native";
import { calculateAge } from "../utilities/functions";
import { VideoView, useVideoPlayer } from "expo-video";

/**
 * Props:
 *  - user: user object
 *  - videoUrl: string | null    (user.videoURLs[0])
 *  - isActive: boolean         (only active card should play)
 */
const capitalize = (s) =>
  typeof s === "string" && s.length
    ? s.charAt(0).toUpperCase() + s.slice(1)
    : "";

const SwipeCard = ({ user, videoUrl, isActive }) => {
  const [muted, setMuted] = useState(true); // start muted for autoplay policies
  const [isBuffering, setIsBuffering] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // create a player instance (imperative API)
  const player = useVideoPlayer(null);

  // memoize display values
  const { age, displayName, displayGender, displayReligion } = useMemo(() => {
    return {
      age: calculateAge(user.birthdate),
      displayName: (user.name || "").trim(),
      displayGender: capitalize(user.gender),
      displayReligion: capitalize(user.religion),
    };
  }, [user.birthdate, user.name, user.gender, user.religion]);

  // When videoUrl changes or active state changes, update player
  useEffect(() => {
    if (!videoUrl) {
      // nothing to play
      try {
        player.pause();
        player.replace(undefined);
      } catch (e) {
        // ignore
      }
      return;
    }

    if (isActive) {
      // load and play
      try {
        player.replace(videoUrl);
        player.loop = true;
        player.play();
        // set initial mute state
        player.muted = muted;
      } catch (e) {
        console.warn("Error starting video player:", e);
      }
    } else {
      // if not active, pause and unload to save resources
      try {
        player.pause();
        player.replace(undefined);
      } catch (e) {
        // ignore
      }
    }

    // cleanup: on unmount ensure paused/unloaded
    return () => {
      try {
        player.pause();
        player.replace(undefined);
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, videoUrl]);

  // keep player.muted in sync with local state
  useEffect(() => {
    try {
      player.muted = muted;
    } catch (e) {
      // some platforms might behave differently — safe guard
      console.warn("Unable to set player.muted:", e);
    }
  }, [muted, player]);

  // handlers for gestures
  const handleTap = () => {
    // toggle mute/unmute
    setMuted((m) => !m);
  };

  const handlePressIn = () => {
    // pause on long press start (we'll set a small threshold on long press)
    setIsLongPressing(true);
    try {
      player.pause();
    } catch (e) {
      console.warn("pause failed:", e);
    }
  };

  const handlePressOut = () => {
    setIsLongPressing(false);
    // resume ONLY if this card is still active
    if (isActive) {
      try {
        player.play();
      } catch (e) {
        console.warn("play failed:", e);
      }
    }
  };

  // Optional: show spinner while buffering (expo-video emits timeUpdate events;
  // for simplicity, we show spinner briefly on mount for active card)
  useEffect(() => {
    if (!isActive) {
      setIsBuffering(false);
      return;
    }
    // show a tiny buffer indicator for active card while video loads
    setIsBuffering(true);
    const t = setTimeout(() => setIsBuffering(false), 800); // optimistic
    return () => clearTimeout(t);
  }, [isActive]);

  return (
    <View style={styles.card}>
      {/* Video area */}
      <Pressable
        onPress={handleTap}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.videoWrapper}
      >
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          contentFit="cover"
          surfaceType="auto"
          nativeControls={false} // 🔥 THIS HIDES ALL CONTROLS ON WEB
        />

        {isBuffering && (
          <View style={styles.bufferOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        {/* small mute indicator */}
        <View style={styles.muteBadge}>
          <Text style={styles.muteText}>{muted ? "Muted" : "Unmuted"}</Text>
        </View>
      </Pressable>

      {/* Card content overlay */}
      <View style={styles.metaContainer}>
        <Text style={styles.name}>{displayName}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <User size={16} color="#222" />
            <Text style={styles.infoText}>{displayGender}</Text>
          </View>

          <View style={styles.dot} />
          <Text style={styles.infoText}>{age} yrs</Text>

          <View style={styles.dot} />
          <Text style={styles.infoText}>{displayReligion}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.hobbyContainer}>
            {user.interests?.map((item, idx) => (
              <View key={idx} style={styles.hobbyChip}>
                <Text style={styles.hobbyText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* replay button remains but now it's just replays the video from start */}
        <TouchableOpacity
          style={styles.replayButton}
          onPress={() => {
            try {
              player.seekTo(0);
              player.play();
            } catch (e) {
              console.warn("replay failed:", e);
            }
          }}
        >
          <RotateCcw size={16} color="#fff" />
          <Text style={styles.replayText}>Replay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default React.memo(SwipeCard);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#fff",
    margin: 12,
    elevation: 6,
  },
  videoWrapper: {
    flex: 1.6,
    backgroundColor: "#000",
    width: "100%",
    height: undefined,
    justifyContent: "center",
    alignItems: "center",
  },
  bufferOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  muteBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  muteText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  metaContainer: {
    padding: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#222",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#222",
    marginHorizontal: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#333",
    marginHorizontal: 8,
  },
  section: {
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },
  hobbyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  hobbyChip: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  hobbyText: {
    color: "#222",
    fontSize: 13,
  },
  replayButton: {
    marginTop: 12,
    backgroundColor: "#007AFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  replayText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "700",
  },
});
