import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { aiService, ChatMessage } from '../services/ai';
import { useCircleStore } from '../stores/circleStore';

interface DisplayMessage extends ChatMessage {
  id: string;
}

const SUGGESTIONS = [
  'What are signs of caregiver burnout?',
  'Tips for sundowning behavior',
  'How to organize medications',
  'Fall prevention at home',
  'Self-care tips for caregivers',
  'How to talk about end-of-life care',
];

export default function CareAssistantScreen() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { activeCircleId } = useCircleStore();

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const scrollToEnd = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: DisplayMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setError(null);
    setLoading(true);
    scrollToEnd();

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await aiService.chat(text.trim(), history, activeCircleId || undefined);

      const assistantMsg: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      scrollToEnd();
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot reach server. Please check your connection.');
      } else {
        setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const showEmptyState = messages.length === 0 && !loading;

  return (
    <>
      <Stack.Screen options={{ title: 'Care Assistant', headerShown: true }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.messageList}
            contentContainerStyle={styles.messageContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={scrollToEnd}
          >
            <Animated.View style={{ opacity: fadeAnim }}>
              {showEmptyState && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🤖💛</Text>
                  <Text style={styles.emptyTitle}>Care Assistant</Text>
                  <Text style={styles.emptyDesc}>
                    Ask me anything about caregiving — medication questions, daily routines, emotional support, or practical tips.
                  </Text>
                  <View style={styles.disclaimer}>
                    <Text style={styles.disclaimerText}>
                      I can offer guidance and support, but always consult healthcare professionals for medical decisions.
                    </Text>
                  </View>
                  <Text style={styles.suggestionsLabel}>Try asking:</Text>
                  <View style={styles.suggestions}>
                    {SUGGESTIONS.map((s, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.suggestionChip}
                        onPress={() => sendMessage(s)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.suggestionText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  {msg.role === 'assistant' && (
                    <Text style={styles.assistantIcon}>🤖</Text>
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      msg.role === 'user' ? styles.userText : styles.assistantText,
                    ]}
                  >
                    {msg.content}
                  </Text>
                </View>
              ))}

              {loading && (
                <View style={[styles.messageBubble, styles.assistantBubble]}>
                  <Text style={styles.assistantIcon}>🤖</Text>
                  <View style={styles.typingRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.typingText}>Thinking...</Text>
                  </View>
                </View>
              )}

              {error && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity onPress={() => setError(null)}>
                    <Text style={styles.errorDismiss}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </ScrollView>

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about caregiving..."
              placeholderTextColor={colors.textHint}
              multiline
              maxLength={2000}
              editable={!loading}
              onSubmitEditing={() => sendMessage(input)}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              activeOpacity={0.7}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },

  messageList: { flex: 1 },
  messageContent: { padding: 16, paddingBottom: 8 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 24, paddingHorizontal: 8 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { ...typography.headingLarge, color: colors.textPrimary, marginBottom: 8 },
  emptyDesc: { ...typography.bodyMedium, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 16, maxWidth: 320 },
  disclaimer: { backgroundColor: colors.primaryLight, padding: 12, borderRadius: 12, marginBottom: 20, maxWidth: 340 },
  disclaimerText: { ...typography.bodySmall, color: colors.primaryDark, textAlign: 'center', lineHeight: 18 },
  suggestionsLabel: { ...typography.labelMedium, color: colors.textHint, marginBottom: 10 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, maxWidth: 380 },
  suggestionChip: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
  },
  suggestionText: { ...typography.bodySmall, color: colors.primary },

  // Messages
  messageBubble: { marginBottom: 12, maxWidth: '85%', padding: 14, borderRadius: 18 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  assistantBubble: {
    alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: colors.divider,
  },
  assistantIcon: { fontSize: 16, marginBottom: 6 },
  messageText: { lineHeight: 22 },
  userText: { ...typography.bodyMedium, color: '#fff' },
  assistantText: { ...typography.bodyMedium, color: colors.textPrimary },

  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { ...typography.bodySmall, color: colors.textHint },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FEE2E2', padding: 12, borderRadius: 12, marginTop: 8,
  },
  errorText: { ...typography.bodySmall, color: colors.danger, flex: 1 },
  errorDismiss: { ...typography.labelMedium, color: colors.danger, marginLeft: 12 },

  // Input
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.divider,
  },
  textInput: {
    flex: 1, ...typography.bodyMedium, color: colors.textPrimary,
    backgroundColor: colors.bg, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    maxHeight: 100, minHeight: 42,
  },
  sendButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: colors.border },
  sendIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
