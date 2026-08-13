import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/supabase_client.dart';
import '../../core/theme.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../providers/subscription_provider.dart';

class _ProfileStat {
  final String label;
  final int value;
  const _ProfileStat(this.label, this.value);
}

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  List<_ProfileStat> _stats = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _fetchStats());
  }

  Future<void> _fetchStats() async {
    final auth = ref.read(authProvider);
    final user = auth.user;
    final profile = auth.profile;
    if (user == null) return;
    try {
      final results = await Future.wait([
        supabase.from('favorites').select('id').eq('user_id', user.id).count(),
        supabase.from('tenant_interests').select('id').eq('tenant_id', user.id).count(),
        supabase.from('properties').select('id').eq('owner_id', user.id).count(),
      ]);
      final stats = <_ProfileStat>[_ProfileStat('Favoris', results[0].count)];
      if (profile != null && isSearcherRole(profile.role)) {
        stats.add(_ProfileStat('Demandes', results[1].count));
      }
      if (profile != null && isPublisherRole(profile.role)) {
        stats.add(_ProfileStat('Annonces', results[2].count));
      }
      if (mounted) setState(() => _stats = stats);
    } catch (_) {}
  }

  Future<void> _handleSignOut() async {
    await ref.read(authProvider.notifier).signOut();
    if (mounted) context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final user = auth.user;
    final profile = auth.profile;

    if (user == null || profile == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 88,
                    height: 88,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: AppColors.saleLight, borderRadius: BorderRadius.circular(28)),
                    child: const Icon(LucideIcons.user, size: 40, color: AppColors.primary),
                  ),
                  const SizedBox(height: 20),
                  const Text('Gérez votre compte', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.text)),
                  const SizedBox(height: 12),
                  const Text(
                    'Connectez-vous pour accéder à votre profil, vos annonces et vos demandes.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.55),
                  ),
                  const SizedBox(height: 20),
                  GestureDetector(
                    onTap: () => context.push('/login'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 32),
                      decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(12)),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(LucideIcons.logIn, size: 18, color: AppColors.textInverse),
                          SizedBox(width: 8),
                          Text('Se connecter', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textInverse)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  GestureDetector(
                    onTap: () => context.push('/register'),
                    child: const Text(
                      'Créer un compte',
                      style: TextStyle(fontSize: 14, color: AppColors.primary, fontWeight: FontWeight.w600, decoration: TextDecoration.underline),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    final roleCfg = roleConfigs[profile.role]!;
    final subscription = ref.watch(subscriptionProvider);
    final isPremium = subscription.isPremium;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: ListView(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(vertical: 28),
              decoration: const BoxDecoration(
                gradient: LinearGradient(colors: AppColors.gradientPrimary, begin: Alignment.topLeft, end: Alignment.bottomRight),
              ),
              child: Column(
                children: [
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      profile.avatarUrl != null
                          ? CircleAvatar(radius: 40, backgroundImage: NetworkImage(profile.avatarUrl!))
                          : Container(
                              width: 80,
                              height: 80,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 2),
                              ),
                              child: Text(
                                (profile.displayName.isNotEmpty ? profile.displayName : 'U').substring(0, profile.displayName.length >= 2 ? 2 : 1).toUpperCase(),
                                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: AppColors.textInverse),
                              ),
                            ),
                      if (profile.isVerified)
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            width: 22,
                            height: 22,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: AppColors.accent,
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.surface, width: 2),
                            ),
                            child: const Icon(LucideIcons.star, size: 10, color: AppColors.textInverse),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    profile.displayName.isNotEmpty ? profile.displayName : 'Utilisateur',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.textInverse),
                  ),
                  if (profile.agencyName.isNotEmpty)
                    Text(profile.agencyName, style: const TextStyle(fontSize: 12, color: Colors.white70, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    alignment: WrapAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 12),
                        decoration: BoxDecoration(
                          color: roleCfg.color.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: roleCfg.color.withValues(alpha: 0.6)),
                        ),
                        child: Text(roleCfg.labelFr, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textInverse)),
                      ),
                      if (roleCfg.isPro)
                        Container(
                          padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(LucideIcons.briefcase, size: 10, color: AppColors.textInverse),
                              SizedBox(width: 4),
                              Text('Pro', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textInverse)),
                            ],
                          ),
                        ),
                      if (profile.kycVerified)
                        Container(
                          padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                          decoration: BoxDecoration(
                            color: AppColors.success.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.success.withValues(alpha: 0.4)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(LucideIcons.checkCircle, size: 10, color: AppColors.success),
                              SizedBox(width: 4),
                              Text('KYC', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.success)),
                            ],
                          ),
                        ),
                      if (isPremium)
                        Container(
                          padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 10),
                          decoration: BoxDecoration(
                            color: AppColors.accent.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.accent.withValues(alpha: 0.4)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(LucideIcons.crown, size: 12, color: AppColors.accent),
                              const SizedBox(width: 4),
                              Text(
                                subscription.isTrialActive ? 'Essai' : 'Premium',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.accent),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text('ID: ${profile.anonymousId}', style: const TextStyle(fontSize: 11, color: Colors.white54)),
                ],
              ),
            ),
            if (!isPremium && isPublisherRole(profile.role))
              GestureDetector(
                onTap: () => context.push('/subscription'),
                child: Container(
                  margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.accentLight.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.accent.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(color: AppColors.accentLight.withValues(alpha: 0.25), borderRadius: BorderRadius.circular(12)),
                        child: const Icon(LucideIcons.crown, size: 18, color: AppColors.accent),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Passez en Premium', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.text)),
                            Text("7 jours d'essai gratuit", style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          ],
                        ),
                      ),
                      const Icon(LucideIcons.chevronRight, size: 18, color: AppColors.accent),
                    ],
                  ),
                ),
              ),
            if (_stats.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(top: 12),
                decoration: const BoxDecoration(
                  color: AppColors.surface,
                  border: Border(bottom: BorderSide(color: AppColors.border)),
                ),
                child: Row(
                  children: _stats.asMap().entries.map((entry) {
                    final isLast = entry.key == _stats.length - 1;
                    return Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        decoration: BoxDecoration(
                          border: isLast ? null : const Border(right: BorderSide(color: AppColors.border)),
                        ),
                        child: Column(
                          children: [
                            Text('${entry.value.value}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.primary)),
                            const SizedBox(height: 2),
                            Text(entry.value.label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            _buildSection('Activité', [
              _MenuRow(icon: LucideIcons.heart, iconColor: AppColors.error, label: 'Mes Favoris', onTap: () => context.push('/home/favorites')),
              if (isPublisherRole(profile.role))
                _MenuRow(icon: LucideIcons.building2, iconColor: AppColors.accent, label: 'Mes Annonces', onTap: () => context.push('/my-listings')),
              if (isSearcherRole(profile.role))
                _MenuRow(icon: LucideIcons.fileText, iconColor: AppColors.primary, label: 'Mes Demandes', onTap: () => context.push('/my-requests')),
              if (profile.role == 'admin')
                _MenuRow(icon: LucideIcons.settings, iconColor: AppColors.text, label: 'Tableau de bord Admin', badge: 'Admin', onTap: () => context.push('/admin')),
            ]),
            _buildSection('Compte', [
              _MenuRow(
                icon: LucideIcons.crown,
                iconColor: AppColors.accent,
                label: 'Abonnement',
                badge: isPremium ? 'Premium' : 'Gratuit',
                onTap: () => context.push('/subscription'),
              ),
              _MenuRow(icon: LucideIcons.user, iconColor: AppColors.textSecondary, label: 'Modifier le profil', onTap: () => context.push('/edit-profile')),
              _MenuRow(icon: LucideIcons.bell, iconColor: AppColors.textSecondary, label: 'Notifications', onTap: () {}),
              _MenuRow(icon: LucideIcons.shield, iconColor: AppColors.textSecondary, label: 'Confidentialité et sécurité', onTap: () {}),
            ]),
            Container(
              margin: const EdgeInsets.only(top: 12),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border), bottom: BorderSide(color: AppColors.border)),
              ),
              child: GestureDetector(
                onTap: _handleSignOut,
                child: const Padding(
                  padding: EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(LucideIcons.logOut, size: 18, color: AppColors.error),
                      SizedBox(width: 12),
                      Text('Se déconnecter', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.error)),
                    ],
                  ),
                ),
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.home, size: 16, color: AppColors.textTertiary),
                  SizedBox(width: 6),
                  Text('1 Futur Chez Vous - 2026', style: TextStyle(fontSize: 12, color: AppColors.textTertiary)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border), bottom: BorderSide(color: AppColors.border)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
            child: Text(
              title.toUpperCase(),
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textTertiary, letterSpacing: 1),
            ),
          ),
          ...children,
        ],
      ),
    );
  }
}

class _MenuRow extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String? badge;
  final VoidCallback onTap;

  const _MenuRow({required this.icon, required this.iconColor, required this.label, this.badge, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 16),
        decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.borderLight))),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: AppColors.surfaceSecondary, borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, size: 18, color: iconColor),
            ),
            const SizedBox(width: 12),
            Expanded(child: Text(label, style: const TextStyle(fontSize: 15, color: AppColors.text, fontWeight: FontWeight.w500))),
            if (badge != null)
              Container(
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.symmetric(vertical: 3, horizontal: 8),
                decoration: BoxDecoration(color: AppColors.accentLight.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8)),
                child: Text(badge!, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.accent)),
              ),
            const Icon(LucideIcons.chevronRight, size: 16, color: AppColors.textTertiary),
          ],
        ),
      ),
    );
  }
}
