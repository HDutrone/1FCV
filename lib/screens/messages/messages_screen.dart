import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/theme.dart';
import '../../data/conversations_repository.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/animated_scale_tap.dart';
import '../../widgets/skeleton.dart';

class _ConversationItem {
  final String id;
  final String propertyTitle;
  final String lastMessageAt;
  final String otherPartyLabel;

  _ConversationItem({
    required this.id,
    required this.propertyTitle,
    required this.lastMessageAt,
    required this.otherPartyLabel,
  });
}

class MessagesScreen extends ConsumerStatefulWidget {
  const MessagesScreen({super.key});

  @override
  ConsumerState<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends ConsumerState<MessagesScreen> {
  List<_ConversationItem> _conversations = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _fetchConversations());
  }

  Future<void> _fetchConversations() async {
    final auth = ref.read(authProvider);
    final user = auth.user;
    final profile = auth.profile;
    if (user == null || profile == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    setState(() => _loading = true);
    final data = await conversationsRepository.fetchConversations(user.id);
    final items = data.map((c) {
      var label = 'Administrateur';
      if (profile.role == 'admin') {
        label = c['conversation_type'] == 'searcher_admin' ? 'Chercheur' : 'Annonceur';
      }
      final property = c['property'] as Map<String, dynamic>?;
      return _ConversationItem(
        id: c['id'] as String,
        propertyTitle: property?['title'] as String? ?? 'Bien immobilier',
        lastMessageAt: c['last_message_at'] as String? ?? '',
        otherPartyLabel: label,
      );
    }).toList();
    if (!mounted) return;
    setState(() {
      _conversations = items;
      _loading = false;
    });
  }

  String _formatDate(String dateStr) {
    final date = DateTime.tryParse(dateStr);
    if (date == null) return '';
    final now = DateTime.now();
    final days = now.difference(date).inDays;
    if (days <= 0) return "Aujourd'hui";
    if (days == 1) return 'Hier';
    return 'Il y a $days jours';
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;

    if (user == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Column(
            children: [
              _buildHeader(showBadge: false),
              Expanded(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.xxxl),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: AppColors.saleLight,
                            borderRadius: BorderRadius.circular(AppRadius.xl),
                          ),
                          child: const Icon(LucideIcons.messageCircle, size: 36, color: AppColors.primary),
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        const Text(
                          'Connectez-vous pour accéder à vos messages',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.text),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        const Text(
                          'Toutes les communications passent par notre plateforme sécurisée.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
                        ),
                        const SizedBox(height: AppSpacing.xl),
                        AnimatedScaleTap(
                          onTap: () => context.push('/login'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 28),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(AppRadius.md),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(LucideIcons.logIn, size: 18, color: AppColors.textInverse),
                                SizedBox(width: 8),
                                Text(
                                  'Se connecter',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textInverse),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _buildHeader(showBadge: true),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
              color: AppColors.saleLight,
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(LucideIcons.lock, size: 14, color: AppColors.primary),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      "Toutes les communications passent par l'administrateur. Propriétaires et chercheurs ne peuvent pas s'écrire directement.",
                      style: TextStyle(fontSize: 12, color: AppColors.primary, height: 1.5),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: _loading
                  ? const RowSkeletonList(count: 5)
                  : _conversations.isEmpty
                      ? _buildEmpty()
                      : RefreshIndicator(
                          onRefresh: _fetchConversations,
                          color: AppColors.primary,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(AppSpacing.lg),
                            itemCount: _conversations.length,
                            itemBuilder: (context, index) => _buildConversationRow(_conversations[index]),
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConversationRow(_ConversationItem item) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: AnimatedScaleTap(
        onTap: () => context.push('/conversation/${item.id}'),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            boxShadow: AppShadows.sm,
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.saleLight,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: const Icon(LucideIcons.home, size: 20, color: AppColors.primary),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.propertyTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.text),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${item.otherPartyLabel} • ${_formatDate(item.lastMessageAt)}',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              const Icon(LucideIcons.chevronRight, size: 16, color: AppColors.textTertiary),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader({required bool showBadge}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.lg),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Messages', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.text)),
          if (showBadge) ...[
            const SizedBox(height: 4),
            const Row(
              children: [
                Icon(LucideIcons.lock, size: 12, color: AppColors.primary),
                SizedBox(width: 4),
                Text(
                  'Communications sécurisées',
                  style: TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(LucideIcons.messageCircle, size: 48, color: AppColors.border),
            const SizedBox(height: AppSpacing.md),
            const Text(
              'Aucune conversation',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.text),
            ),
            const SizedBox(height: AppSpacing.sm),
            const Text(
              'Vos échanges avec les propriétaires et candidats apparaîtront ici.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
            ),
          ],
        ),
      ),
    );
  }
}
