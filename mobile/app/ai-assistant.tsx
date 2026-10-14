import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { CATEGORIES, FAQS } from '../src/assistant/faqs';
import { isForRole } from '../src/assistant/matcher';
import { assistant } from '../src/assistant/provider';
import type { AssistantReply, FaqCategoryId } from '../src/assistant/types';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme/colors';
import type { UserRole } from '../src/theme/colors';

type Message =
  | { id: number; from: 'user'; text: string }
  | { id: number; from: 'assistant'; reply: AssistantReply };

const GREETING =
  'Hi! I can guide you through the app step by step. Pick a topic or a question below, or type what you want to do.';

export default function AiAssistantScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const role = (user?.role ?? 'roaster') as UserRole;
  const nextId = useRef(1);
  const listRef = useRef<FlatList<Message>>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [category, setCategory] = useState<FaqCategoryId | null>(null);

  const starters = useMemo(() => assistant.starters(role), [role]);
  const categories = useMemo(
    () => CATEGORIES.filter((c) => FAQS.some((f) => f.category === c.id && isForRole(f, role))),
    [role],
  );
  const categoryQuestions = useMemo(
    () =>
      category
        ? FAQS.filter((f) => f.category === category && isForRole(f, role)).map((f) => ({
            id: f.id,
            question: f.question,
          }))
        : [],
    [category, role],
  );

  // Offer follow-ups from the last answer; otherwise the starter list.
  const last = messages[messages.length - 1];
  const followUps =
    last?.from === 'assistant' && last.reply.suggestions.length > 0 ? last.reply.suggestions : starters;
  const shownChips = category ? categoryQuestions : followUps;

  async function ask(params: { text?: string; faqId?: string }, label: string) {
    setMessages((prev) => [...prev, { id: nextId.current++, from: 'user', text: label }]);
    setCategory(null);
    const reply = await assistant.ask({ ...params, role });
    setMessages((prev) => [...prev, { id: nextId.current++, from: 'assistant', reply }]);
  }

  function submitText() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    Keyboard.dismiss();
    void ask({ text }, text);
  }

  function reset() {
    setMessages([]);
    setCategory(null);
    setInput('');
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View style={styles.header}>
        <ScreenHeader title="Help Guide" style={styles.headerTitle} />
        {messages.length > 0 && (
          <Pressable onPress={reset} style={styles.resetBtn} hitSlop={8}>
            <Ionicons name="refresh-outline" size={20} color={colors.navy} />
          </Pressable>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.messageList}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={
          <View style={[styles.bubble, styles.assistantBubble]}>
            <Ionicons name="book-outline" size={14} color={colors.navy} style={styles.bubbleIcon} />
            <Text style={[styles.messageText, styles.assistantText, styles.flex]}>{GREETING}</Text>
          </View>
        }
        renderItem={({ item }) =>
          item.from === 'user' ? (
            <View style={[styles.bubble, styles.userBubble]}>
              <Text style={[styles.messageText, styles.userText]}>{item.text}</Text>
            </View>
          ) : (
            <ReplyBubble reply={item.reply} />
          )
        }
      />

      <ScrollView
        style={styles.suggestions}
        contentContainerStyle={styles.suggestionsContent}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <View style={styles.chipWrap}>
          {category ? (
            <Chip icon="chevron-back" label="Topics" onPress={() => setCategory(null)} muted />
          ) : (
            categories.map((c) => (
              <Chip
                key={c.id}
                icon={c.icon as keyof typeof Ionicons.glyphMap}
                label={c.title}
                onPress={() => setCategory(c.id)}
                muted
              />
            ))
          )}
        </View>
        <View style={styles.chipWrap}>
          {shownChips.map((s) => (
            <Chip key={s.id} label={s.question} onPress={() => ask({ faqId: s.id }, s.question)} />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="Type what you want to do…"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={submitText}
            returnKeyType="send"
            maxLength={200}
            placeholderTextColor={colors.textMuted}
          />
          <Pressable
            onPress={submitText}
            disabled={!input.trim()}
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          >
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function Chip({
  label,
  onPress,
  icon,
  muted,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  muted?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, muted && styles.chipMuted]}>
      {icon ? <Ionicons name={icon} size={14} color={colors.navy} /> : null}
      <Text style={styles.chipText} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function ReplyBubble({ reply }: { reply: AssistantReply }) {
  return (
    <View style={[styles.bubble, styles.assistantBubble, styles.replyBubble]}>
      <Ionicons name="book-outline" size={14} color={colors.navy} style={styles.bubbleIcon} />
      <View style={styles.replyBody}>
        <Text style={[styles.messageText, styles.assistantText]}>{reply.text}</Text>
        {reply.steps?.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <Text style={styles.stepNum}>{i + 1}.</Text>
            <Text style={[styles.messageText, styles.assistantText, styles.flex]}>{step}</Text>
          </View>
        ))}
        {reply.tips?.map((tip, i) => (
          <Text key={i} style={styles.tip}>
            Tip: {tip}
          </Text>
        ))}
        {reply.action && (
          <Pressable style={styles.actionBtn} onPress={() => router.push(reply.action!.path as never)}>
            <Text style={styles.actionText}>{reply.action.label}</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.white} />
          </Pressable>
        )}
        {!reply.matched && (
          <Pressable style={styles.actionBtn} onPress={() => router.push('/support')}>
            <Text style={styles.actionText}>Contact support</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.white} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  headerTitle: { flex: 1 },
  resetBtn: { padding: 8 },
  messageList: { paddingHorizontal: 16, paddingVertical: 12 },
  bubble: {
    marginVertical: 6,
    maxWidth: '88%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: colors.surface },
  replyBubble: { maxWidth: '94%' },
  replyBody: { flex: 1, gap: 6 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.navy },
  bubbleIcon: { marginTop: 2 },
  messageText: { fontSize: 14, lineHeight: 20 },
  assistantText: { color: colors.text },
  userText: { color: colors.white },
  stepRow: { flexDirection: 'row', gap: 6 },
  stepNum: { fontSize: 14, lineHeight: 20, color: colors.navy2, fontWeight: '600', width: 18 },
  tip: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, fontStyle: 'italic' },
  actionBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.navy,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 4,
  },
  actionText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  // Chips wrap onto new lines; the area is capped so a long list scrolls instead of
  // squeezing out the conversation.
  suggestions: { flexGrow: 0, maxHeight: 190, marginTop: 6 },
  suggestionsContent: { gap: 8, paddingBottom: 4 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipMuted: { backgroundColor: colors.lavender, borderColor: colors.navy2 },
  chipText: { fontSize: 13, color: colors.navy, flexShrink: 1 },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    marginTop: 8,
  },
  inputBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
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
  sendButtonDisabled: { backgroundColor: colors.textMuted, opacity: 0.5 },
});
