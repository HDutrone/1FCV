import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/supabase_client.dart';
import '../../core/theme.dart';
import '../../data/properties_repository.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/animated_scale_tap.dart';

enum _AdminTab { overview, properties, users }

const _roleOrder = ['tenant', 'buyer', 'owner', 'seller', 'agent', 'promoter', 'investor', 'admin'];

class _AdminStats {
  final int totalUsers;
  final int totalProperties;
  final int pendingProperties;
  final int activeProperties;
  final int totalInterests;
  final int totalSubscriptions;

  const _AdminStats({
    required this.totalUsers,
    required this.totalProperties,
    required this.pendingProperties,
    required this.activeProperties,
    required this.totalInterests,
    required this.totalSubscriptions,
  });

  _AdminStats copyWith({int? pendingProperties, int? activeProperties}) => _AdminStats(
        totalUsers: totalUsers,
        totalProperties: totalProperties,
        pendingProperties: pendingProperties ?? this.pendingProperties,
        activeProperties: activeProperties ?? this.activeProperties,
        totalInterests: totalInterests,
        totalSubscriptions: totalSubscriptions,
      );
}

String _formatCount(num value) {
  final s = value.toInt().toString();
  final buffer = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i != 0 && (s.length - i) % 3 == 0) buffer.write(' ');
    buffer.write(s[i]);
  }
  return buffer.toString();
}

Profile _profileWith(Profile p, {String? status, String? role}) => Profile(
      id: p.id,
      displayName: p.displayName,
      anonymousId: p.anonymousId,
      role: role ?? p.role,
      avatarUrl: p.avatarUrl,
      cityId: p.cityId,
      communeId: p.communeId,
      bio: p.bio,
      isVerified: p.isVerified,
      commissionRate: p.commissionRate,
      kycVerified: p.kycVerified,
      agencyName: p.agencyName,
      phoneNumber: p.phoneNumber,
      status: status ?? p.status,
    );

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  _AdminStats? _stats;
  List<Property> _pendingProperties = [];
  List<Profile> _recentUsers = [];
  bool _loading = true;
  _AdminTab _activeTab = _AdminTab.overview;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (ref.read(authProvider).profile?.role == 'admin') _fetchData();
    });
  }

  Future<void> _fetchData() async {
    if (mounted) setState(() => _loading = true);

    final counts = await Future.wait([
      supabase.from('profiles').count(),
      supabase.from('properties').count(),
      supabase.from('properties').count().eq('status', 'pending'),
      supabase.from('properties').count().eq('status', 'active'),
      supabase.from('tenant_interests').count(),
      supabase.from('user_subscriptions').count().eq('status', 'active'),
    ]);

    final pendingData = await supabase
        .from('properties')
        .select(propertySelectWithRelations)
        .eq('status', 'pending')
        .order('created_at', ascending: false)
        .limit(10);

    final usersData = await supabase.from('profiles').select('*').order('created_at', ascending: false).limit(10);

    if (!mounted) return;
    setState(() {
      _stats = _AdminStats(
        totalUsers: counts[0],
        totalProperties: counts[1],
        pendingProperties: counts[2],
        activeProperties: counts[3],
        totalInterests: counts[4],
        totalSubscriptions: counts[5],
      );
      _pendingProperties = (pendingData as List).map((e) => Property.fromJson(e)).toList();
      _recentUsers = (usersData as List).map((e) => Profile.fromJson(e)).toList();
      _loading = false;
    });
  }

  Future<void> _approveProperty(String id) async {
    await supabase.from('properties').update({'status': 'active'}).eq('id', id);
    if (!mounted) return;
    setState(() {
      _pendingProperties = _pendingProperties.where((p) => p.id != id).toList();
      final stats = _stats;
      if (stats != null) {
        _stats = stats.copyWith(pendingProperties: stats.pendingProperties - 1, activeProperties: stats.activeProperties + 1);
      }
    });
  }

  Future<void> _rejectProperty(String id) async {
    await supabase.from('properties').update({'status': 'inactive'}).eq('id', id);
    if (!mounted) return;
    setState(() {
      _pendingProperties = _pendingProperties.where((p) => p.id != id).toList();
      final stats = _stats;
      if (stats != null) {
        _stats = stats.copyWith(pendingProperties: stats.pendingProperties - 1);
      }
    });
  }

  Future<Profile> _performUserAction(String action, Profile user) async {
    const statusMap = {'suspend': 'suspended', 'ban': 'banned', 'activate': 'active'};
    final newStatus = statusMap[action]!;
    await supabase.from('profiles').update({'status': newStatus}).eq('id', user.id);
    final updated = _profileWith(user, status: newStatus);
    if (mounted) {
      setState(() => _recentUsers = _recentUsers.map((u) => u.id == user.id ? updated : u).toList());
    }
    return updated;
  }

  Future<Profile> _promoteRole(String role, Profile user) async {
    await supabase.from('profiles').update({'role': role}).eq('id', user.id);
    final updated = _profileWith(user, role: role);
    if (mounted) {
      setState(() => _recentUsers = _recentUsers.map((u) => u.id == user.id ? updated : u).toList());
    }
    return updated;
  }

  Future<void> _deleteUser(Profile user) async {
    final deleted = await supabase.from('profiles').delete().eq('id', user.id).select('id');
    if ((deleted as List).isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Échec de la suppression : droits insuffisants ou compte déjà supprimé.')),
        );
      }
      return;
    }
    if (mounted) {
      setState(() => _recentUsers = _recentUsers.where((u) => u.id != user.id).toList());
    }
  }

  void _openUserSheet(Profile user) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (sheetContext) => _UserActionsSheet(
        user: user,
        onAction: (action) => _performUserAction(action, user),
        onPromote: (role) => _promoteRole(role, user),
        onDelete: () async {
          await _deleteUser(user);
          if (sheetContext.mounted) Navigator.of(sheetContext).pop();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(authProvider).profile;

    if (profile?.role != 'admin') {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.xxxl),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(LucideIcons.shield, size: 48, color: AppColors.error),
                  const SizedBox(height: AppSpacing.md),
                  const Text('Accès refusé', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.text)),
                  const SizedBox(height: AppSpacing.sm),
                  const Text(
                    "Vous n'avez pas les droits pour accéder à cette page.",
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  AnimatedScaleTap(
                    onTap: () => context.pop(),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 32),
                      decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(AppRadius.md)),
                      child: const Text('Retour', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textInverse)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

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
            _buildTabBar(),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _fetchData,
                color: AppColors.primary,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: _buildTabContent(),
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
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, AppSpacing.md),
      decoration: const BoxDecoration(color: AppColors.surface, border: Border(bottom: BorderSide(color: AppColors.border))),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.pop(),
            child: Container(
              width: 38,
              height: 38,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: AppColors.surfaceSecondary, borderRadius: BorderRadius.circular(AppRadius.md)),
              child: const Icon(LucideIcons.arrowLeft, size: 22, color: AppColors.text),
            ),
          ),
          Expanded(
            child: Column(
              children: [
                const Text('Tableau de bord', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.text)),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(color: AppColors.text, borderRadius: BorderRadius.circular(AppRadius.sm)),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(LucideIcons.shield, size: 10, color: AppColors.textInverse),
                      SizedBox(width: 4),
                      Text('Admin', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textInverse)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 38),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    final tabs = [
      (_AdminTab.overview, "Vue d'ensemble"),
      (_AdminTab.properties, 'Annonces'),
      (_AdminTab.users, 'Utilisateurs'),
    ];
    return Container(
      decoration: const BoxDecoration(color: AppColors.surface, border: Border(bottom: BorderSide(color: AppColors.border))),
      child: Row(
        children: tabs.map((tab) {
          final active = _activeTab == tab.$1;
          return Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _activeTab = tab.$1),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: active ? AppColors.primary : Colors.transparent, width: 2)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      tab.$2,
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: active ? AppColors.primary : AppColors.textTertiary),
                    ),
                    if (tab.$1 == _AdminTab.properties && (_stats?.pendingProperties ?? 0) > 0) ...[
                      const SizedBox(width: 6),
                      Container(
                        width: 18,
                        height: 18,
                        alignment: Alignment.center,
                        decoration: const BoxDecoration(color: AppColors.warning, shape: BoxShape.circle),
                        child: Text(
                          '${_stats!.pendingProperties}',
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.textInverse),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildTabContent() {
    switch (_activeTab) {
      case _AdminTab.overview:
        return _buildOverviewTab();
      case _AdminTab.properties:
        return _buildPropertiesTab();
      case _AdminTab.users:
        return _buildUsersTab();
    }
  }

  Widget _sectionLabel(String text) => Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.md, top: 4),
        child: Text(
          text.toUpperCase(),
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textTertiary, letterSpacing: 1),
        ),
      );

  Widget _buildOverviewTab() {
    final stats = _stats;
    if (stats == null) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionLabel('Statistiques globales'),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 3,
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 0.92,
          children: [
            _statCard(
              icon: LucideIcons.users,
              label: 'Utilisateurs',
              value: stats.totalUsers,
              color: AppColors.primary,
              onTap: () => setState(() => _activeTab = _AdminTab.users),
            ),
            _statCard(
              icon: LucideIcons.building2,
              label: 'Annonces',
              value: stats.totalProperties,
              color: AppColors.accent,
              onTap: () => setState(() => _activeTab = _AdminTab.properties),
            ),
            _statCard(
              icon: LucideIcons.clock,
              label: 'En attente',
              value: stats.pendingProperties,
              color: AppColors.warning,
              urgent: stats.pendingProperties > 0,
              onTap: () => setState(() => _activeTab = _AdminTab.properties),
            ),
            _statCard(
              icon: LucideIcons.checkCircle,
              label: 'Actives',
              value: stats.activeProperties,
              color: AppColors.success,
              onTap: () => setState(() => _activeTab = _AdminTab.properties),
            ),
            _statCard(
              icon: LucideIcons.trendingUp,
              label: 'Demandes',
              value: stats.totalInterests,
              color: AppColors.info,
              onTap: () => context.go('/home/messages'),
            ),
            _statCard(
              icon: LucideIcons.eye,
              label: 'Abonnements',
              value: stats.totalSubscriptions,
              color: const Color(0xFF7C3AED),
              onTap: () => context.push('/subscription'),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.lg),
        if (stats.pendingProperties > 0)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.xl),
            child: AnimatedScaleTap(
              onTap: () => setState(() => _activeTab = _AdminTab.properties),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.warningLight,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  border: Border.all(color: AppColors.warning.withValues(alpha: 0.4)),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.alertTriangle, size: 18, color: AppColors.warning),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        '${stats.pendingProperties} annonce${stats.pendingProperties > 1 ? 's' : ''} en attente de validation',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.text),
                      ),
                    ),
                    const Icon(LucideIcons.chevronRight, size: 16, color: AppColors.warning),
                  ],
                ),
              ),
            ),
          ),
        _sectionLabel('Accès rapides'),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: AppColors.border),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              _quickAction(
                icon: LucideIcons.clock,
                label: 'Valider les annonces',
                bg: AppColors.warningLight,
                fg: AppColors.warning,
                onTap: () => setState(() => _activeTab = _AdminTab.properties),
              ),
              const Divider(height: 1, color: AppColors.borderLight),
              _quickAction(
                icon: LucideIcons.users,
                label: 'Gérer les utilisateurs',
                bg: AppColors.infoLight,
                fg: AppColors.info,
                onTap: () => setState(() => _activeTab = _AdminTab.users),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPropertiesTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionLabel('Annonces en attente (${_pendingProperties.length})'),
        if (_pendingProperties.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 48),
            child: Column(
              children: [
                const Icon(LucideIcons.checkCircle, size: 40, color: AppColors.success),
                const SizedBox(height: AppSpacing.md),
                const Text('Tout est à jour !', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.text)),
                const SizedBox(height: AppSpacing.xs),
                const Text(
                  'Aucune annonce en attente de validation.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                ),
              ],
            ),
          )
        else
          ..._pendingProperties.map(_propertyCard),
      ],
    );
  }

  Widget _buildUsersTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionLabel('Utilisateurs récents (${_recentUsers.length})'),
        ..._recentUsers.map(_userRow),
      ],
    );
  }

  Widget _statCard({
    required IconData icon,
    required String label,
    required int value,
    required Color color,
    bool urgent = false,
    VoidCallback? onTap,
  }) {
    final card = Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: urgent ? AppColors.warningLight : AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: urgent ? AppColors.warning : AppColors.border),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 40,
            height: 40,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(AppRadius.md)),
            child: Icon(icon, size: 20, color: color),
          ),
          const SizedBox(height: 6),
          Text(_formatCount(value), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.text)),
          const SizedBox(height: 2),
          Text(label, textAlign: TextAlign.center, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
        ],
      ),
    );
    if (onTap == null) return card;
    return AnimatedScaleTap(scaleTo: 0.96, onTap: onTap, child: card);
  }

  Widget _quickAction({required IconData icon, required String label, required Color bg, required Color fg, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(AppRadius.md)),
              child: Icon(icon, size: 22, color: fg),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(child: Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.text))),
            const Icon(LucideIcons.chevronRight, size: 16, color: AppColors.textTertiary),
          ],
        ),
      ),
    );
  }

  Widget _propertyCard(Property property) {
    final location = [property.commune?.name, property.city?.name].where((e) => e != null && e.isNotEmpty).join(', ');
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      property.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.text),
                    ),
                    const SizedBox(height: 2),
                    Text(location.isEmpty ? '—' : location, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight.withValues(alpha: 0.13),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Text(
                  property.listingType == 'rent' ? 'Location' : 'Vente',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${_formatCount(property.price)} ${property.currency}',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.accent),
              ),
              Text(
                '${property.bedrooms}ch · ${property.bathrooms}bain · ${property.surfaceArea.toStringAsFixed(0)}m²',
                style: const TextStyle(fontSize: 12, color: AppColors.textTertiary),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            property.description.isEmpty ? 'Aucune description' : property.description,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: AnimatedScaleTap(
                  onTap: () => _rejectProperty(property.id),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppColors.errorLight,
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      border: Border.all(color: AppColors.error, width: 1.5),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(LucideIcons.xCircle, size: 16, color: AppColors.error),
                        SizedBox(width: 6),
                        Text('Rejeter', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.error)),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: AnimatedScaleTap(
                  onTap: () => _approveProperty(property.id),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: AppColors.success, borderRadius: BorderRadius.circular(AppRadius.md)),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(LucideIcons.checkCircle, size: 16, color: AppColors.textInverse),
                        SizedBox(width: 6),
                        Text('Approuver', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textInverse)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _userRow(Profile user) {
    final color = roleConfigs[user.role]?.color ?? AppColors.textTertiary;
    final statusColor = user.status == 'banned'
        ? AppColors.error
        : user.status == 'suspended'
            ? AppColors.warning
            : AppColors.success;
    final initials = user.displayName.isNotEmpty ? user.displayName.substring(0, user.displayName.length >= 2 ? 2 : 1).toUpperCase() : 'U';

    return AnimatedScaleTap(
      onTap: () => _openUserSheet(user),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: color.withValues(alpha: 0.13), shape: BoxShape.circle),
              child: Text(initials, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: color)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user.displayName.isNotEmpty ? user.displayName : 'Utilisateur',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.text),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    'ID: ${user.anonymousId}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, color: AppColors.textTertiary, fontFamily: 'monospace'),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                    border: Border.all(color: color.withValues(alpha: 0.4)),
                  ),
                  child: Text(user.role, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                  ),
                  child: Text(user.status, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: statusColor)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _UserActionsSheet extends StatefulWidget {
  final Profile user;
  final Future<Profile> Function(String action) onAction;
  final Future<Profile> Function(String role) onPromote;
  final Future<void> Function() onDelete;

  const _UserActionsSheet({
    required this.user,
    required this.onAction,
    required this.onPromote,
    required this.onDelete,
  });

  @override
  State<_UserActionsSheet> createState() => _UserActionsSheetState();
}

class _UserActionsSheetState extends State<_UserActionsSheet> {
  late Profile _user;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _user = widget.user;
  }

  Future<void> _runAction(String action) async {
    setState(() => _loading = true);
    final updated = await widget.onAction(action);
    if (!mounted) return;
    setState(() {
      _user = updated;
      _loading = false;
    });
  }

  Future<void> _runPromote(String role) async {
    if (role == _user.role || _loading) return;
    setState(() => _loading = true);
    final updated = await widget.onPromote(role);
    if (!mounted) return;
    setState(() {
      _user = updated;
      _loading = false;
    });
  }

  Future<void> _runDelete() async {
    setState(() => _loading = true);
    await widget.onDelete();
  }

  @override
  Widget build(BuildContext context) {
    final color = roleConfigs[_user.role]?.color ?? AppColors.textTertiary;
    final initials = _user.displayName.isNotEmpty ? _user.displayName.substring(0, _user.displayName.length >= 2 ? 2 : 1).toUpperCase() : 'U';
    final isSuspended = _user.status == 'suspended';
    final isBanned = _user.status == 'banned';

    return DraggableScrollableSheet(
      initialChildSize: 0.68,
      minChildSize: 0.4,
      maxChildSize: 0.92,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xxl)),
          ),
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.only(bottom: 24),
            children: [
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text("Gérer l'utilisateur", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.text)),
                    ),
                    GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: const Icon(LucideIcons.x, size: 22, color: AppColors.text),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: AppColors.border),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(color: color.withValues(alpha: 0.13), shape: BoxShape.circle),
                      child: Text(initials, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color)),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _user.displayName.isNotEmpty ? _user.displayName : 'Utilisateur',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.text),
                          ),
                          const SizedBox(height: 2),
                          Text('Rôle : ${_user.role}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          Text('Statut : ${_user.status}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              _sectionLabel('ACTIONS'),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Expanded(
                      child: _actionButton(
                        icon: LucideIcons.userX,
                        label: isSuspended ? 'Réactiver' : 'Suspendre',
                        color: AppColors.warning,
                        onTap: _loading ? null : () => _runAction(isSuspended ? 'activate' : 'suspend'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _actionButton(
                        icon: LucideIcons.ban,
                        label: isBanned ? 'Débannir' : 'Bannir',
                        color: AppColors.error,
                        onTap: _loading ? null : () => _runAction(isBanned ? 'activate' : 'ban'),
                      ),
                    ),
                  ],
                ),
              ),
              _sectionLabel('PROMOUVOIR LE RÔLE'),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _roleOrder.map((role) {
                    final active = _user.role == role;
                    return GestureDetector(
                      onTap: _loading || active ? null : () => _runPromote(role),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 12),
                        decoration: BoxDecoration(
                          color: active ? AppColors.primary : AppColors.surfaceSecondary,
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                          border: Border.all(color: active ? AppColors.primary : AppColors.border),
                        ),
                        child: Text(
                          roleConfigs[role]?.label ?? role,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: active ? AppColors.textInverse : AppColors.textSecondary,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: GestureDetector(
                  onTap: _loading ? null : _runDelete,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: AppColors.error, borderRadius: BorderRadius.circular(AppRadius.md)),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(LucideIcons.trash2, size: 16, color: AppColors.textInverse),
                        SizedBox(width: 8),
                        Text('Supprimer le compte', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textInverse)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _sectionLabel(String text) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 10),
        child: Text(
          text,
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textTertiary, letterSpacing: 1),
        ),
      );

  Widget _actionButton({required IconData icon, required String label, required Color color, required VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.surfaceSecondary,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: color.withValues(alpha: 0.4), width: 1.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
          ],
        ),
      ),
    );
  }
}
