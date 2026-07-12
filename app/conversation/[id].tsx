import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Platform, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, Lock, Shield } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Message } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

interface ConversationDetail {
  id: string;
  property: { title: string; listing_type: string } | null;
  tenant_id: string;
  owner_id: string;
  conversation_type: string;
  admin_id: string | null;
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchConversation = useCallback(async () => {
    const { data } = await supabase
      .from('conversations')
      .select('id, tenant_id, owner_id, conversation_type, admin_id, property:properties(title, listing_type)')
      .eq('id', id)
      .maybeSingle();
    if (data) setConversation(data as any);
  }, [id]);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });
    if (data) {
      setMessages(data as Message[]);
      if (user) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', id)
          .neq('sender_id', user.id);
      }
    }
  }, [id, user]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchConversation(), fetchMessages()]).finally(() => setLoading(false));
  }, [fetchConversation, fetchMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`,
      }, (payload) => {
        const msg = payload.new as Message;
        setMessages(prev => [...prev, msg]);
        if (user && msg.sender_id !== user.id) {
          supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: user.id,
      content,
    });

    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', id);

    setSending(false);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Aujourd\'hui';
    if (d.toDateString() === yesterday.toDateString()) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  const otherPartyLabel = conversation
    ? (profile?.role === 'admin'
        ? (conversation.conversation_type === 'searcher_admin' ? 'Chercheur' : 'Annonceur')
        : 'Administrateur')
    : '';

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.sender_id === user?.id;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showDate = !prevMsg || new Date(item.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

    return (
      <View>
        {showDate && (
          <View style={msgStyles.dateHeader}>
            <Text style={msgStyles.dateText}>{formatDateHeader(item.created_at)}</Text>
          </View>
        )}
        <View style={[msgStyles.bubble, isOwn ? msgStyles.bubbleOwn : msgStyles.bubbleOther]}>
          <Text style={[msgStyles.msgText, isOwn && msgStyles.msgTextOwn]}>{item.content}</Text>
          <Text style={[msgStyles.timeText, isOwn && msgStyles.timeTextOwn]}>{formatTime(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {conversation?.property?.title || 'Conversation'}
          </Text>
          <Text style={styles.headerSubtitle}>{otherPartyLabel}</Text>
        </View>
        <View style={styles.securityIcon}>
          <Shield size={16} color={Colors.primary} />
        </View>
      </View>

      <View style={styles.securityBanner}>
        <Lock size={12} color={Colors.primary} />
        <Text style={styles.securityText}>
          Communication mediee par l'administrateur - Aucun contact direct entre propriétaire et chercheur
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>
              Commencez la conversation. Toutes les communications restent anonymes.
            </Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ecrivez un message..."
          placeholderTextColor={Colors.textTertiary}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!newMessage.trim() || sending}
        >
          <Send size={18} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const msgStyles = StyleSheet.create({
  dateHeader: { alignItems: 'center', marginVertical: 12 },
  dateText: {
    fontSize: 12, color: Colors.textTertiary, fontWeight: '600',
    backgroundColor: Colors.surfaceSecondary, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 10,
  },
  bubble: {
    maxWidth: '78%', padding: 12, borderRadius: 16, marginBottom: 6,
  },
  bubbleOwn: {
    alignSelf: 'flex-end', backgroundColor: Colors.primary,
    borderBottomRightRadius: 4, marginLeft: 48,
  },
  bubbleOther: {
    alignSelf: 'flex-start', backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4, marginRight: 48,
    borderWidth: 1, borderColor: Colors.border,
  },
  msgText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  msgTextOwn: { color: Colors.textInverse },
  timeText: { fontSize: 10, color: Colors.textTertiary, marginTop: 4, textAlign: 'right' },
  timeTextOwn: { color: 'rgba(255,255,255,0.6)' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  headerSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  securityIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.saleLight, alignItems: 'center', justifyContent: 'center',
  },
  securityBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: Colors.saleLight,
  },
  securityText: { flex: 1, fontSize: 11, color: Colors.primary, fontWeight: '500' },
  messagesList: { padding: 16, flexGrow: 1 },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyChatText: { fontSize: 14, color: Colors.textTertiary, textAlign: 'center', lineHeight: 20 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  input: {
    flex: 1, minHeight: 42, maxHeight: 100,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
