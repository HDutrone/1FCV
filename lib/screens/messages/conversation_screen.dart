import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/supabase_client.dart';
import '../../core/theme.dart';
import '../../data/conversations_repository.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';

const _months = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

class _ConversationDetail {
  final String propertyTitle;
  final double propertyPrice;
  final String listingType;
  final String conversationType;
  final String? relatedConversationId;
  final String? advertiserName;
  final String? advertiserRole;

  _ConversationDetail({
    required this.propertyTitle,
    required this.propertyPrice,
    required this.listingType,
    required this.conversationType,
    this.relatedConversationId,
    this.advertiserName,
    this.advertiserRole,
  });
}

class ConversationScreen extends ConsumerStatefulWidget {
  final String conversationId;

  const ConversationScreen({super.key, required this.conversationId});

  @override
  ConsumerState<ConversationScreen> createState() => _ConversationScreenState();
}

class _ConversationScreenState extends ConsumerState<ConversationScreen> {
  final _scrollController = ScrollController();
  final _inputController = TextEditingController();

  RealtimeChannel? _channel;
  _ConversationDetail? _conversation;
  List<AppMessage> _messages = [];
  bool _loading = true;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _load();
    _subscribeToMessages();
    _inputController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    final channel = _channel;
    if (channel != null) supabase.removeChannel(channel);
    _scrollController.dispose();
    _inputController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final results = await Future.wait([
      conversationsRepository.fetchConversation(widget.conversationId),
      conversationsRepository.fetchMessages(widget.conversationId),
    ]);

    final convData = results[0] as Map<String, dynamic>?;
    final messages = results[1] as List<AppMessage>;

    if (convData != null) {
      final property = convData['property'] as Map<String, dynamic>?;
      final owner = property?['owner'] as Map<String, dynamic>?;
      _conversation = _ConversationDetail(
        propertyTitle: property?['title'] as String? ?? 'Conversation',
        propertyPrice: (property?['price'] as num?)?.toDouble() ?? 0,
        listingType: property?['listing_type'] as String? ?? 'rent',
        conversationType: convData['conversation_type'] as String? ?? '',
        relatedConversationId: convData['related_conversation_id'] as String?,
        advertiserName: (owner?['display_name'] as String?)?.trim().isNotEmpty == true
            ? owner!['display_name'] as String
            : (owner?['agency_name'] as String?),
        advertiserRole: owner?['role'] as String?,
      );
    }
    _messages = messages;

    final user = ref.read(authProvider).user;
    if (user != null) {
      await conversationsRepository.markRead(widget.conversationId, user.id);
    }

    if (!mounted) return;
    setState(() => _loading = false);
    _scrollToBottom();
  }

  void _subscribeToMessages() {
    _channel = supabase
        .channel('messages-${widget.conversationId}')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'messages',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'conversation_id',
            value: widget.conversationId,
          ),
          callback: (payload) {
            final msg = AppMessage.fromJson(payload.newRecord);
            if (_messages.any((m) => m.id == msg.id)) return;
            setState(() => _messages = [..._messages, msg]);
            final user = ref.read(authProvider).user;
            if (user != null && msg.senderId != user.id) {
              supabase.from('messages').update({'is_read': true}).eq('id', msg.id);
            }
            _scrollToBottom();
          },
        )
        .subscribe();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> _handleSend() async {
    final content = _inputController.text.trim();
    final user = ref.read(authProvider).user;
    if (content.isEmpty || user == null || _sending) return;

    setState(() => _sending = true);
    _inputController.clear();

    await conversationsRepository.sendMessage(widget.conversationId, user.id, content);

    if (!mounted) return;
    setState(() => _sending = false);
  }

  bool _sameDay(DateTime a, DateTime b) => a.year == b.year && a.month == b.month && a.day == b.day;

  String _formatTime(String dateStr) {
    final d = DateTime.tryParse(dateStr)?.toLocal();
    if (d == null) return '';
    return '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  }

  String _formatDateHeader(String dateStr) {
    final d = DateTime.tryParse(dateStr)?.toLocal();
    if (d == null) return '';
    final now = DateTime.now();
    final yesterday = now.subtract(const Duration(days: 1));
    if (_sameDay(d, now)) return "Aujourd'hui";
    if (_sameDay(d, yesterday)) return 'Hier';
    return '${d.day} ${_months[d.month - 1]}';
  }

  String get _otherPartyLabel {
    final conversation = _conversation;
    if (conversation == null) return '';
    final profile = ref.read(authProvider).profile;
    if (profile?.role == 'admin') {
      return conversation.conversationType == 'searcher_admin' ? 'Chercheur' : 'Annonceur';
    }
    return 'Administrateur';
  }

  @override
  Widget build(BuildContext context) {
    final currentUserId = ref.watch(authProvider).user?.id;

    if (_loading) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildAdvertiserBanner(),
            _buildSecurityBanner(),
            Expanded(
              child: _messages.isEmpty
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.symmetric(horizontal: AppSpacing.xxxl, vertical: 40),
                        child: Text(
                          'Commencez la conversation. Toutes les communications restent anonymes.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 14, color: AppColors.textTertiary, height: 1.4),
                        ),
                      ),
                    )
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      itemCount: _messages.length,
                      itemBuilder: (context, index) {
                        final message = _messages[index];
                        final isOwn = message.senderId == currentUserId;
                        final prev = index > 0 ? _messages[index - 1] : null;
                        final prevDate = prev != null ? DateTime.tryParse(prev.createdAt)?.toLocal() : null;
                        final thisDate = DateTime.tryParse(message.createdAt)?.toLocal();
                        final showDate = prev == null || (thisDate != null && prevDate != null && !_sameDay(thisDate, prevDate));

                        return Column(
                          children: [
                            if (showDate)
                              Container(
                                margin: const EdgeInsets.symmetric(vertical: AppSpacing.md),
                                padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 12),
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceSecondary,
                                  borderRadius: BorderRadius.circular(AppRadius.sm + 2),
                                ),
                                child: Text(
                                  _formatDateHeader(message.createdAt),
                                  style: const TextStyle(fontSize: 12, color: AppColors.textTertiary, fontWeight: FontWeight.w600),
                                ),
                              ),
                            Align(
                              alignment: isOwn ? Alignment.centerRight : Alignment.centerLeft,
                              child: Container(
                                constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                                margin: EdgeInsets.only(
                                  bottom: 6,
                                  left: isOwn ? 48 : 0,
                                  right: isOwn ? 0 : 48,
                                ),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: isOwn ? AppColors.primary : AppColors.surface,
                                  borderRadius: BorderRadius.only(
                                    topLeft: const Radius.circular(16),
                                    topRight: const Radius.circular(16),
                                    bottomLeft: Radius.circular(isOwn ? 16 : 4),
                                    bottomRight: Radius.circular(isOwn ? 4 : 16),
                                  ),
                                  border: isOwn ? null : Border.all(color: AppColors.border),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      message.content,
                                      style: TextStyle(
                                        fontSize: 14,
                                        height: 1.4,
                                        color: isOwn ? AppColors.textInverse : AppColors.text,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      _formatTime(message.createdAt),
                                      textAlign: TextAlign.right,
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: isOwn ? Colors.white.withValues(alpha: 0.6) : AppColors.textTertiary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
            ),
            _buildInputBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final title = _conversation?.propertyTitle ?? 'Conversation';
    return Container(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, AppSpacing.md),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.pop(),
            child: Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.surfaceSecondary,
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: const Icon(LucideIcons.arrowLeft, size: 20, color: AppColors.text),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.text),
                ),
                const SizedBox(height: 1),
                Text(_otherPartyLabel, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
          ),
          Container(
            width: 36,
            height: 36,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.saleLight,
              borderRadius: BorderRadius.circular(AppRadius.sm + 2),
            ),
            child: const Icon(LucideIcons.shield, size: 16, color: AppColors.primary),
          ),
        ],
      ),
    );
  }

  Widget _buildAdvertiserBanner() {
    final conversation = _conversation;
    final profile = ref.read(authProvider).profile;
    final isAdmin = profile?.role == 'admin';
    if (conversation == null || !isAdmin || conversation.conversationType != 'searcher_admin') {
      return const SizedBox.shrink();
    }

    final priceFormat = NumberFormat('#,##0', 'fr_FR');
    final advertiserName = conversation.advertiserName?.trim().isNotEmpty == true
        ? conversation.advertiserName!
        : 'Annonceur inconnu';
    final advertiserRoleLabel = roleConfigs[conversation.advertiserRole]?.label ?? conversation.advertiserRole ?? '';
    final relatedId = conversation.relatedConversationId;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      margin: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, 0),
      decoration: BoxDecoration(
        color: AppColors.surfaceSecondary,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.building2, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  '${conversation.propertyTitle} · \$${priceFormat.format(conversation.propertyPrice)}'
                  '${conversation.listingType == 'rent' ? '/mois' : ''}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(LucideIcons.user, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 6),
              Expanded(
                child: Text.rich(
                  TextSpan(
                    text: advertiserName,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.text),
                    children: [
                      if (advertiserRoleLabel.isNotEmpty)
                        TextSpan(
                          text: '  ($advertiserRoleLabel)',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: AppColors.textTertiary),
                        ),
                    ],
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          if (relatedId != null) ...[
            const SizedBox(height: AppSpacing.sm),
            GestureDetector(
              onTap: () => context.push('/conversation/$relatedId'),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(AppRadius.sm + 2),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.messageCircle, size: 14, color: AppColors.textInverse),
                    SizedBox(width: 6),
                    Text(
                      "Contacter l'annonceur",
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textInverse),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSecurityBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
      color: AppColors.saleLight,
      child: const Row(
        children: [
          Icon(LucideIcons.lock, size: 12, color: AppColors.primary),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              "Communication médiée par l'administrateur — aucun contact direct entre propriétaire et chercheur",
              style: TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputBar() {
    final canSend = _inputController.text.trim().isNotEmpty && !_sending;
    return Container(
      padding: EdgeInsets.only(
        left: AppSpacing.lg,
        right: AppSpacing.lg,
        top: AppSpacing.sm + 2,
        bottom: AppSpacing.sm + 2,
      ),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Container(
              constraints: const BoxConstraints(minHeight: 42, maxHeight: 100),
              decoration: BoxDecoration(
                color: AppColors.surfaceSecondary,
                borderRadius: BorderRadius.circular(AppRadius.xl),
                border: Border.all(color: AppColors.border),
              ),
              child: TextField(
                controller: _inputController,
                maxLength: 1000,
                minLines: 1,
                maxLines: 4,
                style: const TextStyle(fontSize: 15, color: AppColors.text),
                decoration: const InputDecoration(
                  hintText: 'Écrivez un message...',
                  hintStyle: TextStyle(color: AppColors.textTertiary),
                  border: InputBorder.none,
                  counterText: '',
                  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: canSend ? _handleSend : null,
            child: Opacity(
              opacity: canSend ? 1 : 0.4,
              child: Container(
                width: 42,
                height: 42,
                alignment: Alignment.center,
                decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                child: const Icon(LucideIcons.send, size: 18, color: AppColors.textInverse),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
