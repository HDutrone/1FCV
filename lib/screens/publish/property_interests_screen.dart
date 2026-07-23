import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/supabase_client.dart';
import '../../core/theme.dart';
import '../../data/conversations_repository.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/animated_scale_tap.dart';
import '../../widgets/skeleton.dart';

const _monthsFr = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

String _formatDate(DateTime date) => '${date.day} ${_monthsFr[date.month - 1]} ${date.year}';

class _StatusInfo {
  final String label;
  final Color color;
  final Color bg;
  final IconData icon;
  const _StatusInfo(this.label, this.color, this.bg, this.icon);
}

const _statusConfig = <String, _StatusInfo>{
  'pending': _StatusInfo('En attente', AppColors.warning, AppColors.warningLight, LucideIcons.clock),
  'reviewed': _StatusInfo('Examinée', AppColors.info, AppColors.infoLight, LucideIcons.eye),
  'accepted': _StatusInfo('Acceptée', AppColors.success, AppColors.successLight, LucideIcons.checkCircle),
  'rejected': _StatusInfo('Refusée', AppColors.error, AppColors.errorLight, LucideIcons.xCircle),
};

class _InterestDetail {
  final String id;
  final String status;
  final String message;
  final DateTime createdAt;
  final String? tenantId;
  final String anonymousId;
  final String bio;

  _InterestDetail({
    required this.id,
    required this.status,
    required this.message,
    required this.createdAt,
    required this.tenantId,
    required this.anonymousId,
    required this.bio,
  });

  factory _InterestDetail.fromJson(Map<String, dynamic> json) {
    final tenant = json['tenant'] as Map<String, dynamic>?;
    return _InterestDetail(
      id: json['id'] as String,
      status: json['status'] as String? ?? 'pending',
      message: json['message'] as String? ?? '',
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ?? DateTime.now(),
      tenantId: tenant?['id'] as String?,
      anonymousId: tenant?['anonymous_id'] as String? ?? 'Candidat anonyme',
      bio: tenant?['bio'] as String? ?? '',
    );
  }

  _InterestDetail copyWith({String? status}) => _InterestDetail(
        id: id,
        status: status ?? this.status,
        message: message,
        createdAt: createdAt,
        tenantId: tenantId,
        anonymousId: anonymousId,
        bio: bio,
      );
}

class PropertyInterestsScreen extends ConsumerStatefulWidget {
  final String propertyId;
  final String propertyTitle;

  const PropertyInterestsScreen({super.key, required this.propertyId, required this.propertyTitle});

  @override
  ConsumerState<PropertyInterestsScreen> createState() => _PropertyInterestsScreenState();
}

class _PropertyInterestsScreenState extends ConsumerState<PropertyInterestsScreen> {
  bool _loading = true;
  List<_InterestDetail> _interests = [];
  String? _processingId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (widget.propertyId.isEmpty) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    if (mounted) setState(() => _loading = true);
    final data = await supabase.from('tenant_interests').select('''
          id, status, message, created_at,
          tenant:profiles!tenant_interests_tenant_id_fkey(id, anonymous_id, display_name, bio)
        ''').eq('property_id', widget.propertyId).order('created_at', ascending: false);
    if (!mounted) return;
    setState(() {
      _interests = (data as List).map((e) => _InterestDetail.fromJson(e as Map<String, dynamic>)).toList();
      _loading = false;
    });
  }

  /// Accepting/rejecting a candidate never talks to them directly: status
  /// changes and the admin-mediated conversation are both handled by
  /// respond_to_tenant_interest, a server-side function the owner cannot
  /// bypass to wire a direct channel to the tenant.
  Future<void> _updateStatus(String interestId, String newStatus, String? tenantId) async {
    final ownerId = ref.read(authProvider).user?.id;
    if (ownerId == null) return;
    setState(() => _processingId = interestId);

    try {
      await conversationsRepository.respondToInterest(interestId, newStatus);
      if (!mounted) return;
      setState(() {
        _interests = _interests.map((i) => i.id == interestId ? i.copyWith(status: newStatus) : i).toList();
        _processingId = null;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _processingId = null);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Une erreur est survenue. Veuillez réessayer.')),
      );
    }
  }

  Future<void> _openConversation(String tenantId) async {
    final ownerId = ref.read(authProvider).user?.id;
    if (ownerId == null) return;
    final conv = await conversationsRepository.findOwnerAdminConversation(widget.propertyId, ownerId);
    if (conv != null && mounted) {
      context.push('/conversation/${conv['id']}');
    }
  }

  void _openDetail(_InterestDetail item) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _InterestDetailSheet(
        item: item,
        processing: _processingId == item.id,
        onAccept: () {
          Navigator.pop(ctx);
          _updateStatus(item.id, 'accepted', item.tenantId);
        },
        onReject: () {
          Navigator.pop(ctx);
          _updateStatus(item.id, 'rejected', item.tenantId);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pendingCount = _interests.where((i) => i.status == 'pending').length;
    final acceptedCount = _interests.where((i) => i.status == 'accepted').length;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildStats(pendingCount, acceptedCount),
            _buildPrivacyNote(),
            Expanded(
              child: _loading
                  ? const RowSkeletonList(count: 4)
                  : _interests.isEmpty
                      ? _buildEmpty()
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(AppSpacing.lg),
                            itemCount: _interests.length,
                            itemBuilder: (context, index) {
                              final item = _interests[index];
                              return _CandidateCard(
                                item: item,
                                processing: _processingId == item.id,
                                onTap: () => _openDetail(item),
                                onAccept: () => _updateStatus(item.id, 'accepted', item.tenantId),
                                onReject: () => _updateStatus(item.id, 'rejected', item.tenantId),
                                onOpenConversation: item.tenantId != null ? () => _openConversation(item.tenantId!) : null,
                              );
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: const BoxDecoration(color: AppColors.surface, border: Border(bottom: BorderSide(color: AppColors.border))),
      child: Row(
        children: [
          AnimatedScaleTap(
            onTap: () => context.pop(),
            child: Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: AppColors.surfaceSecondary, borderRadius: BorderRadius.circular(AppRadius.md)),
              child: const Icon(LucideIcons.arrowLeft, size: 20, color: AppColors.text),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Candidatures', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.text)),
                Text(
                  widget.propertyTitle.isEmpty ? 'Bien immobilier' : widget.propertyTitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStats(int pendingCount, int acceptedCount) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg, horizontal: AppSpacing.lg),
      decoration: const BoxDecoration(color: AppColors.surface, border: Border(bottom: BorderSide(color: AppColors.border))),
      child: Row(
        children: [
          Expanded(child: _StatItem(value: '${_interests.length}', label: 'Total', color: AppColors.text)),
          Container(width: 1, height: 30, color: AppColors.border),
          Expanded(child: _StatItem(value: '$pendingCount', label: 'En attente', color: AppColors.warning)),
          Container(width: 1, height: 30, color: AppColors.border),
          Expanded(child: _StatItem(value: '$acceptedCount', label: 'Acceptées', color: AppColors.success)),
        ],
      ),
    );
  }

  Widget _buildPrivacyNote() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.md, horizontal: AppSpacing.lg),
      decoration: const BoxDecoration(color: AppColors.saleLight, border: Border(bottom: BorderSide(color: AppColors.border))),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(LucideIcons.shield, size: 14, color: AppColors.primary),
          SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              'Les identités sont masquées. En acceptant un candidat, une conversation anonyme sera créée automatiquement.',
              style: TextStyle(fontSize: 12, color: AppColors.primary, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(AppSpacing.xxxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Aucune candidature', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.text)),
            SizedBox(height: AppSpacing.sm),
            Text(
              'Les candidats intéressés par votre bien apparaîtront ici.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String value;
  final String label;
  final Color color;

  const _StatItem({required this.value, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: color)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
      ],
    );
  }
}

class _CandidateCard extends StatelessWidget {
  final _InterestDetail item;
  final bool processing;
  final VoidCallback onTap;
  final VoidCallback onAccept;
  final VoidCallback onReject;
  final VoidCallback? onOpenConversation;

  const _CandidateCard({
    required this.item,
    required this.processing,
    required this.onTap,
    required this.onAccept,
    required this.onReject,
    required this.onOpenConversation,
  });

  @override
  Widget build(BuildContext context) {
    final status = _statusConfig[item.status] ?? _statusConfig['pending']!;

    return AnimatedScaleTap(
      scaleTo: 0.98,
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          boxShadow: AppShadows.sm,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: AppColors.saleLight, borderRadius: BorderRadius.circular(AppRadius.sm)),
                  child: const Icon(LucideIcons.user, size: 16, color: AppColors.primary),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.anonymousId, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.text)),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(LucideIcons.calendar, size: 10, color: AppColors.textTertiary),
                          const SizedBox(width: 4),
                          Text(_formatDate(item.createdAt), style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: status.bg, borderRadius: BorderRadius.circular(8)),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(status.icon, size: 12, color: status.color),
                      const SizedBox(width: 4),
                      Text(status.label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: status.color)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            item.message.isNotEmpty
                ? Text(item.message, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4))
                : const Text('Aucun message', style: TextStyle(fontSize: 13, color: AppColors.textTertiary, fontStyle: FontStyle.italic)),
            if (item.status == 'pending') ...[
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Expanded(
                    child: AnimatedScaleTap(
                      onTap: processing ? null : onAccept,
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(color: AppColors.success, borderRadius: BorderRadius.circular(AppRadius.sm)),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(LucideIcons.checkCircle, size: 14, color: AppColors.textInverse),
                            const SizedBox(width: 6),
                            const Text('Accepter', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textInverse)),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: AnimatedScaleTap(
                      onTap: processing ? null : onReject,
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: AppColors.errorLight,
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                          border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(LucideIcons.xCircle, size: 14, color: AppColors.error),
                            const SizedBox(width: 6),
                            const Text('Refuser', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.error)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
            if (item.status == 'accepted' && onOpenConversation != null) ...[
              const SizedBox(height: AppSpacing.md),
              AnimatedScaleTap(
                onTap: onOpenConversation,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                  decoration: BoxDecoration(color: AppColors.saleLight, borderRadius: BorderRadius.circular(AppRadius.sm)),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(LucideIcons.messageCircle, size: 14, color: AppColors.primary),
                      SizedBox(width: 6),
                      Text('Ouvrir la conversation', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary)),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _InterestDetailSheet extends StatelessWidget {
  final _InterestDetail item;
  final bool processing;
  final VoidCallback onAccept;
  final VoidCallback onReject;

  const _InterestDetailSheet({required this.item, required this.processing, required this.onAccept, required this.onReject});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.85),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xxl)),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.all(AppSpacing.xl),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Détail du candidat', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.text)),
                    GestureDetector(onTap: () => Navigator.pop(context), child: const Icon(LucideIcons.x, size: 22, color: AppColors.text)),
                  ],
                ),
              ),
              const Divider(height: 1, color: AppColors.border),
              Padding(
                padding: const EdgeInsets.all(AppSpacing.xl),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(color: AppColors.saleLight, borderRadius: BorderRadius.circular(AppRadius.lg)),
                          child: const Icon(LucideIcons.user, size: 28, color: AppColors.primary),
                        ),
                        const SizedBox(width: AppSpacing.lg),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.anonymousId, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.text)),
                            const SizedBox(height: 2),
                            Text(_formatDate(item.createdAt), style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          ],
                        ),
                      ],
                    ),
                    if (item.bio.isNotEmpty) ...[
                      const SizedBox(height: AppSpacing.xl),
                      const Text('PRÉSENTATION', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary, letterSpacing: 0.5)),
                      const SizedBox(height: 6),
                      Text(item.bio, style: const TextStyle(fontSize: 14, color: AppColors.text, height: 1.4)),
                    ],
                    if (item.message.isNotEmpty) ...[
                      const SizedBox(height: AppSpacing.xl),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(color: AppColors.surfaceSecondary, borderRadius: BorderRadius.circular(AppRadius.md)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('MESSAGE DU CANDIDAT', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary, letterSpacing: 0.5)),
                            const SizedBox(height: 6),
                            Text(item.message, style: const TextStyle(fontSize: 14, color: AppColors.text, height: 1.4)),
                          ],
                        ),
                      ),
                    ],
                    if (item.status == 'pending') ...[
                      const SizedBox(height: AppSpacing.xxl),
                      AnimatedScaleTap(
                        onTap: processing ? null : onAccept,
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(color: AppColors.success, borderRadius: BorderRadius.circular(AppRadius.md)),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(LucideIcons.checkCircle, size: 16, color: AppColors.textInverse),
                              SizedBox(width: 8),
                              Text('Accepter le candidat', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textInverse)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      AnimatedScaleTap(
                        onTap: processing ? null : onReject,
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: AppColors.errorLight,
                            borderRadius: BorderRadius.circular(AppRadius.md),
                            border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(LucideIcons.xCircle, size: 16, color: AppColors.error),
                              SizedBox(width: 8),
                              Text('Refuser', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.error)),
                            ],
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: AppSpacing.lg),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
