import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme.dart';
import '../../data/favorites_repository.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/property_card.dart';
import '../../widgets/skeleton.dart';

class FavoritesScreen extends ConsumerStatefulWidget {
  const FavoritesScreen({super.key});

  @override
  ConsumerState<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends ConsumerState<FavoritesScreen> {
  List<Property> _favorites = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final userId = ref.read(authProvider).user?.id;
    if (userId == null) {
      setState(() => _loading = false);
      return;
    }
    setState(() => _loading = true);
    final favorites = await favoritesRepository.fetchFavoriteProperties(userId);
    if (!mounted) return;
    setState(() {
      _favorites = favorites;
      _loading = false;
    });
  }

  Future<void> _removeFavorite(String propertyId) async {
    final userId = ref.read(authProvider).user?.id;
    if (userId == null) return;
    setState(() => _favorites.removeWhere((p) => p.id == propertyId));
    await favoritesRepository.removeFavorite(userId, propertyId);
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;

    if (user == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          bottom: false,
          child: Column(
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, AppSpacing.lg),
                decoration: const BoxDecoration(
                  color: AppColors.surface,
                  border: Border(bottom: BorderSide(color: AppColors.border)),
                ),
                child: const Text('Mes Favoris', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.text)),
              ),
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
                          child: const Icon(LucideIcons.heart, size: 36, color: AppColors.primary),
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        const Text(
                          'Connectez-vous pour voir vos favoris',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.text),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        const Text(
                          'Sauvegardez les biens qui vous intéressent et retrouvez-les ici.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        AppButton(
                          title: 'Se connecter',
                          onPressed: () => context.push('/login'),
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
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, AppSpacing.lg),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(bottom: BorderSide(color: AppColors.border)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Mes Favoris', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.text)),
                  const SizedBox(height: 2),
                  Text(
                    '${_favorites.length} bien${_favorites.length != 1 ? 's' : ''} sauvegardé${_favorites.length != 1 ? 's' : ''}',
                    style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            Expanded(
              child: _loading
                  ? const ListingsSkeletonList(count: 3)
                  : _favorites.isEmpty
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(AppSpacing.xxxl),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: const [
                                Icon(LucideIcons.heart, size: 48, color: AppColors.border),
                                SizedBox(height: AppSpacing.md),
                                Text('Aucun favori pour l\'instant', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.text)),
                                SizedBox(height: AppSpacing.sm),
                                Text(
                                  'Appuyez sur le cœur d\'un bien pour le sauvegarder ici.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
                                ),
                              ],
                            ),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(AppSpacing.lg),
                          itemCount: _favorites.length,
                          itemBuilder: (context, index) {
                            final property = _favorites[index];
                            return PropertyCard(
                              property: property,
                              isFavorite: true,
                              onToggleFavorite: _removeFavorite,
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
