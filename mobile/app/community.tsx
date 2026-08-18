import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { api } from '../src/api/client';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { SegmentedControl } from '../src/components/SegmentedControl';
import { colors } from '../src/theme/colors';

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  userName: string;
  userRole: string;
  likes: number;
  replies: number;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  userName: string;
  message: string;
  isAgent: boolean;
  createdAt: string;
}

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('discussion');
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get('/community/posts');
      setPosts(result.posts || []);
    } catch (e) {
      console.error('Error loading posts:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const startChat = useCallback(async () => {
    try {
      const result = await api.post('/community/chat/start', {});
      setConversationId(result.conversationId);
      setChatMessages(result.messages || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to start chat');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts]),
  );

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await api.post('/community/posts', {
        title: newPostTitle,
        content: newPostContent,
        category: selectedCategory,
      });
      setNewPostTitle('');
      setNewPostContent('');
      setShowNewPostForm(false);
      loadPosts();
      Alert.alert('Success', 'Post created!');
    } catch (e) {
      Alert.alert('Error', 'Failed to create post');
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !conversationId) return;

    try {
      const result = await api.post(`/community/chat/${conversationId}/send`, {
        message: messageInput,
      });
      setChatMessages(result.messages || []);
      setMessageInput('');
      Keyboard.dismiss();
    } catch (e) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Community" />

      <View style={styles.tabs}>
        <Pressable
          onPress={() => {
            setTab('feed');
            loadPosts();
          }}
          style={[styles.tab, tab === 'feed' && styles.activeTab]}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={18}
            color={tab === 'feed' ? colors.navy : colors.textMuted}
          />
          <Text
            style={[styles.tabText, tab === 'feed' && styles.activeTabText]}
          >
            Discussion Board
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setTab('support');
            if (!conversationId) startChat();
          }}
          style={[styles.tab, tab === 'support' && styles.activeTab]}
        >
          <Ionicons
            name="headset-outline"
            size={18}
            color={tab === 'support' ? colors.navy : colors.textMuted}
          />
          <Text
            style={[styles.tabText, tab === 'support' && styles.activeTabText]}
          >
            Support Chat
          </Text>
        </Pressable>
      </View>

      {tab === 'feed' && (
        <View style={styles.content}>
          {showNewPostForm && (
            <Card style={styles.formCard}>
              <Text style={styles.formTitle}>Create New Post</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Post title"
                  value={newPostTitle}
                  onChangeText={setNewPostTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryButtons}>
                  {['discussion', 'tips', 'news', 'question'].map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setSelectedCategory(cat)}
                      style={[
                        styles.categoryBtn,
                        selectedCategory === cat && styles.categoryBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          selectedCategory === cat && styles.categoryTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Content</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Share your thoughts..."
                  value={newPostContent}
                  onChangeText={setNewPostContent}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formActions}>
                <Button
                  title="Cancel"
                  onPress={() => setShowNewPostForm(false)}
                  variant="secondary"
                />
                <Button
                  title="Post"
                  onPress={handleCreatePost}
                />
              </View>
            </Card>
          )}

          {!showNewPostForm && (
            <Button
              title="Create New Post"
              onPress={() => setShowNewPostForm(true)}
              icon="add-circle-outline"
              style={styles.newPostBtn}
            />
          )}

          {loading ? (
            <ActivityIndicator size="large" color={colors.navy} />
          ) : posts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>
                Be the first to start the conversation!
              </Text>
            </Card>
          ) : (
            <FlatList
              data={posts}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Card style={styles.postCard}>
                  <Pressable onPress={() => router.push(`/post/${item.id}`)}>
                    <View style={styles.postHeader}>
                      <View>
                        <Text style={styles.postTitle}>{item.title}</Text>
                        <View style={styles.postMeta}>
                          <Text style={styles.userName}>
                            {item.userName} • {item.userRole}
                          </Text>
                          <Text style={styles.postDate}>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>
                          {item.category}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.postContent} numberOfLines={3}>
                      {item.content}
                    </Text>

                    <View style={styles.postFooter}>
                      <View style={styles.stat}>
                        <Ionicons
                          name="heart-outline"
                          size={14}
                          color={colors.textMuted}
                        />
                        <Text style={styles.statText}>{item.likes}</Text>
                      </View>
                      <View style={styles.stat}>
                        <Ionicons
                          name="chatbubble-outline"
                          size={14}
                          color={colors.textMuted}
                        />
                        <Text style={styles.statText}>{item.replies}</Text>
                      </View>
                    </View>
                  </Pressable>
                </Card>
              )}
            />
          )}
        </View>
      )}

      {tab === 'support' && conversationId && (
        <View style={styles.chatContainer}>
          <FlatList
            data={chatMessages}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageBubble,
                  item.isAgent && styles.agentMessage,
                ]}
              >
                <Text style={styles.messageUserName}>{item.userName}</Text>
                <Text style={styles.messageText}>{item.message}</Text>
                <Text style={styles.messageTime}>
                  {new Date(item.createdAt).toLocaleTimeString()}
                </Text>
              </View>
            )}
          />

          <View style={styles.inputBar}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type a message..."
              value={messageInput}
              onChangeText={setMessageInput}
            />
            <Pressable onPress={handleSendMessage} style={styles.sendBtn}>
              <Ionicons name="send" size={20} color={colors.white} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.navy,
  },
  tabText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.navy,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  newPostBtn: {
    marginBottom: 12,
  },
  formCard: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
  },
  categoryBtnActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  categoryText: {
    fontSize: 12,
    color: colors.text,
  },
  categoryTextActive: {
    color: colors.white,
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyCard: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },
  postCard: {
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  postMeta: {
    marginTop: 4,
  },
  userName: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text,
  },
  postDate: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: colors.navy20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.navy,
    textTransform: 'capitalize',
  },
  postContent: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 8,
  },
  postFooter: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageBubble: {
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.lavender,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  agentMessage: {
    backgroundColor: colors.navy20,
    alignSelf: 'flex-end',
  },
  messageUserName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  messageTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
