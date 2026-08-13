import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';

class MainShell extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const MainShell({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(authProvider).profile;
    final canPublish = profile != null && isPublisherRole(profile.role);

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: const Border(top: BorderSide(color: AppColors.border, width: 1)),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), offset: const Offset(0, -4), blurRadius: 12)],
        ),
        child: SafeArea(
          child: SizedBox(
            height: 60,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _NavItem(icon: LucideIcons.home, label: 'Accueil', index: 0, currentIndex: navigationShell.currentIndex, onTap: () => _go(0)),
                _NavItem(icon: LucideIcons.heart, label: 'Favoris', index: 1, currentIndex: navigationShell.currentIndex, onTap: () => _go(1)),
                _PublishNavItem(canPublish: canPublish, active: navigationShell.currentIndex == 2, onTap: () => _go(2)),
                _NavItem(icon: LucideIcons.messageCircle, label: 'Messages', index: 3, currentIndex: navigationShell.currentIndex, onTap: () => _go(3)),
                _NavItem(icon: LucideIcons.user, label: 'Profil', index: 4, currentIndex: navigationShell.currentIndex, onTap: () => _go(4)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _go(int index) {
    navigationShell.goBranch(index, initialLocation: index == navigationShell.currentIndex);
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final int index;
  final int currentIndex;
  final VoidCallback onTap;

  const _NavItem({required this.icon, required this.label, required this.index, required this.currentIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final focused = index == currentIndex;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 64,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 22, color: focused ? AppColors.primary : AppColors.textTertiary),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 10, fontWeight: focused ? FontWeight.w700 : FontWeight.w500, color: focused ? AppColors.primary : AppColors.textTertiary)),
          ],
        ),
      ),
    );
  }
}

class _PublishNavItem extends StatelessWidget {
  final bool canPublish;
  final bool active;
  final VoidCallback onTap;

  const _PublishNavItem({required this.canPublish, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: canPublish ? onTap : null,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 64,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 44,
              height: 44,
              margin: const EdgeInsets.only(bottom: 2),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: canPublish ? AppColors.primary : AppColors.textTertiary,
                boxShadow: canPublish ? AppShadows.md : null,
              ),
              child: const Icon(LucideIcons.plusCircle, size: 22, color: AppColors.textInverse),
            ),
            Text('Publier', style: TextStyle(fontSize: 10, fontWeight: active ? FontWeight.w700 : FontWeight.w500, color: active ? AppColors.primary : AppColors.textTertiary)),
          ],
        ),
      ),
    );
  }
}
