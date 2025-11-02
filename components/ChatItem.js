import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native'
import React from 'react'

const ChatItem = ({ onPress , chat}) => {
  // Dummy data

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image
        source={{ uri: chat.profileImageUrl }}
        style={styles.profileImage}
      />
      <View style={styles.contentContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.nameText}>{chat.name}</Text>
          <Text style={styles.messageText} numberOfLines={1}>
            {chat.lastMessage}
          </Text>
        </View>
        <Text style={styles.timeText}>{chat.time}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  profileImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#EEEEEE',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 10,
  },
  nameText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#666',
  },
  timeText: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
})

export default ChatItem