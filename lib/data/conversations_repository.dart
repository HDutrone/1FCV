import '../core/supabase_client.dart';
import '../models/models.dart';

class ConversationsRepository {
  Future<List<Map<String, dynamic>>> fetchConversations(String userId) async {
    final data = await supabase
        .from('conversations')
        .select('id, property_id, last_message_at, status, conversation_type, '
            'property:properties(title, listing_type), tenant_id, owner_id, admin_id')
        .or('tenant_id.eq.$userId,owner_id.eq.$userId')
        .order('last_message_at', ascending: false);
    return (data as List).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>?> fetchConversation(String id) async {
    return await supabase
        .from('conversations')
        .select('id, tenant_id, owner_id, conversation_type, admin_id, property:properties(title, listing_type)')
        .eq('id', id)
        .maybeSingle();
  }

  Future<List<AppMessage>> fetchMessages(String conversationId) async {
    final data = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', ascending: true);
    return (data as List).map((e) => AppMessage.fromJson(e)).toList();
  }

  Future<void> markRead(String conversationId, String userId) async {
    await supabase.from('messages').update({'is_read': true}).eq('conversation_id', conversationId).neq('sender_id', userId);
  }

  Future<void> sendMessage(String conversationId, String senderId, String content) async {
    await supabase.from('messages').insert({
      'conversation_id': conversationId,
      'sender_id': senderId,
      'content': content,
    });
    await supabase.from('conversations').update({'last_message_at': DateTime.now().toIso8601String()}).eq('id', conversationId);
  }

  Future<Map<String, dynamic>?> findConversationForTenant(String propertyId, String tenantId) async {
    return await supabase
        .from('conversations')
        .select('id')
        .eq('property_id', propertyId)
        .eq('tenant_id', tenantId)
        .maybeSingle();
  }
}

final conversationsRepository = ConversationsRepository();
