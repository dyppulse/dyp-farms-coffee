import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiExtended } from '../src/api/client';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { colors } from '../src/theme/colors';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function AiAssistantScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);

  const startConversation = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiExtended.ai.startChat();
      setConversationId(result.conversationId);
      setMessages(result.messages.filter((m: Message) => m.role !== 'system'));
    } catch (e: any) {
      const errorMsg = e?.message || 'Failed to start conversation';
      console.error('Chat start error:', errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!conversationId) {
        startConversation();
      }
    }, [conversationId, startConversation]),
  );

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !conversationId) return;

    const userMessage = messageInput;
    setMessageInput('');

    // Add user message to UI immediately
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage },
    ]);

    setSending(true);
    try {
      const result = await apiExtended.ai.sendMessage(conversationId, userMessage);
      setMessages(result.messages.filter((m: Message) => m.role !== 'system'));

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e: any) {
      const errorMsg = e?.message || 'Failed to send message. Try again.';
      console.error('Message send error:', errorMsg);
      Alert.alert('Error', errorMsg);
      // Remove user message if sending failed
      setMessages((prev) => prev.slice(0, -1));
      setMessageInput(userMessage);
    } finally {
      setSending(false);
      Keyboard.dismiss();
    }
  };

  const clearChat = async () => {
    Alert.alert(
      'Clear Conversation',
      'Start a new conversation?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Clear',
          onPress: async () => {
            try {
              await apiExtended.ai.clearChat(conversationId);
              await startConversation();
            } catch (e) {
              Alert.alert('Error', 'Failed to clear chat');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="AI Assistant" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.navy} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ScreenHeader title="AI Assistant" />
        <Pressable onPress={clearChat} style={styles.clearButton}>
          <Ionicons name="refresh-outline" size={20} color={colors.navy} />
        </Pressable>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="sparkles" size={48} color={colors.navy} />
          </View>
          <Text style={styles.emptyTitle}>AI Assistant Ready</Text>
          <Text style={styles.emptyText}>
            Ask me anything about Dyp Farms Coffee platform - quality grading,
            auctions, financing, subscriptions, logistics, tours, and more!
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, idx) => idx.toString()}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.role === 'assistant'
                  ? styles.assistantBubble
                  : styles.userBubble,
              ]}
            >
              {item.role === 'assistant' && (
                <View style={styles.assistantIcon}>
                  <Ionicons name="sparkles" size={14} color={colors.navy} />
                </View>
              )}
              <Text
                style={[
                  styles.messageText,
                  item.role === 'assistant'
                    ? styles.assistantText
                    : styles.userText,
                ]}
              >
                {item.content}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />
      )}

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything..."
            value={messageInput}
            onChangeText={setMessageInput}
            editable={!sending}
            multiline
            maxLength={500}
            placeholderTextColor={colors.textMuted}
          />
          <Pressable
            onPress={handleSendMessage}
            disabled={sending || !messageInput.trim()}
            style={[
              styles.sendButton,
              (sending || !messageInput.trim()) && styles.sendButtonDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="send" size={18} color={colors.white} />
            )}
          </Pressable>
        </View>
        <Text style={styles.hint}>
          {500 - messageInput.length} characters remaining
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageBubble: {
    marginVertical: 6,
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.lavender,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.navy,
  },
  assistantIcon: {
    marginTop: 2,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  assistantText: {
    color: colors.text,
  },
  userText: {
    color: colors.white,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    maxHeight: 100,
    color: colors.text,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
  hint: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'right',
  },
});
