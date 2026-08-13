import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme.dart';
import '../../data/favorites_repository.dart';
import '../../data/properties_repository.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../providers/mode_provider.dart';
import '../../widgets/animated_scale_tap.dart';
import '../../widgets/filter_bar.dart';
import '../../widgets/property_card.dart';
import '../../widgets/skeleton.dart';

class ListingsScreen extends ConsumerStatefulWidget {
  const ListingsScreen({super.key});

  @override
  ConsumerState<ListingsScreen> createState() => _ListingsScreenState();
}

class _ListingsScreenState extends ConsumerState<ListingsScreen> {
  List<Property> _properties = [];
  Set<String> _favorites = {};
  bool _loading = true;
  bool _showSearch = false;
  String _searchQuery = '';
  final _searchController = TextEditingController();
  late PropertyFilters _filters;

  @override
  void initState() {
    super.initState();
    _filters = PropertyFilters(listingType: ref.read(modeProvider).mode);
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final userId = ref.read(authProvider).user?.id;
    final results = await Future.wait([
      propertiesRepository.fetchProperties(_filters, query: _searchQuery),
      if (userId != null) favoritesRepository.fetchFavoriteIds(userId) else Future.value(<String>{}),
    ]);
    if (!mounted) return;
    setState(() {
      _properties = results[0] as List<Property>;
      _favorites = results[1] as Set<String>;
      _loading = false;
    });
  }

  Future<void> _refresh() async {
    final userId = ref.read(authProvider).user?.id;
    final results = await Future.wait([
      propertiesRepository.fetchProperties(_filters, query: _searchQuery),
      if (userId != null) favoritesRepository.fetchFavoriteIds(userId) else Future.value(<String>{}),
    ]);
    if (!mounted) return;
    setState(() {
      _properties = results[0] as List<Property>;
      _favorites = results[1] as Set<String>;
    });
  }

  void _onFiltersChange(PropertyFilters filters) {
    setState(() => _filters = filters);
    _load();
  }

  void _search() {
    setState(() => _searchQuery = _searchController.text);
    _load();
  }

  void _clearSearch() {
    _searchController.clear();
    setState(() {
      _searchQuery = '';
      _showSearch = false;
    });
    _load();
  }

  Future<void> _toggleFavorite(String propertyId) async {
    final userId = ref.read(authProvider).user?.id;
    if (userId == null) return;
    final isFav = _favorites.contains(propertyId);
    setState(() {
      if (isFav) {
        _favorites.remove(propertyId);
      } else {
        _favorites.add(propertyId);
      }
    });
    if (isFav) {
      await favoritesRepository.removeFavorite(userId, propertyId);
    } else {
      await favoritesRepository.addFavorite(userId, propertyId);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(modeProvider, (previous, next) {
      if (previous?.mode != next.mode) {
        setState(() => _filters = _filters.copyWith(listingType: next.mode));
        _load();
      }
    });
    final mode = ref.watch(modeProvider).mode;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Container(
              color: AppColors.surface,
              padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            '1 Futur Chez Vous',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.primary),
                          ),
                          const SizedBox(height: 1),
                          Text(
                            mode == 'rent' ? 'Location de biens en RDC' : 'Achat immobilier en RDC',
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          _IconButton(
                            icon: LucideIcons.search,
                            active: _showSearch,
                            onTap: () => setState(() => _showSearch = !_showSearch),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          const _IconButton(icon: LucideIcons.bell),
                        ],
                      ),
                    ],
                  ),
                  if (_showSearch)
                    Padding(
                      padding: const EdgeInsets.only(top: AppSpacing.sm, bottom: AppSpacing.md),
                      child: Row(
                        children: [
                          Expanded(
                            child: Container(
                              height: 42,
                              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                              decoration: BoxDecoration(
                                color: AppColors.surfaceSecondary,
                                borderRadius: BorderRadius.circular(AppRadius.md),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Row(
                                children: [
                                  const Icon(LucideIcons.search, size: 16, color: AppColors.textTertiary),
                                  const SizedBox(width: AppSpacing.sm),
                                  Expanded(
                                    child: TextField(
                                      controller: _searchController,
                                      autofocus: true,
                                      textInputAction: TextInputAction.search,
                                      onSubmitted: (_) => _search(),
                                      style: const TextStyle(fontSize: 14, color: AppColors.text),
                                      decoration: const InputDecoration(
                                        hintText: 'Rechercher par titre, description, quartier...',
                                        hintStyle: TextStyle(color: AppColors.textTertiary, fontSize: 13),
                                        border: InputBorder.none,
                                        isCollapsed: true,
                                      ),
                                    ),
                                  ),
                                  if (_searchController.text.isNotEmpty)
                                    GestureDetector(
                                      onTap: _clearSearch,
                                      child: const Icon(LucideIcons.x, size: 16, color: AppColors.textSecondary),
                                    ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          AnimatedScaleTap(
                            onTap: _search,
                            child: Container(
                              height: 42,
                              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(AppRadius.md),
                              ),
                              child: const Text('OK', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textInverse)),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            FilterBar(filters: _filters, onFiltersChange: _onFiltersChange),
            Expanded(
              child: _loading
                  ? const ListingsSkeletonList(count: 4)
                  : _properties.isEmpty
                      ? _EmptyState(searchQuery: _searchQuery, onClearSearch: _clearSearch)
                      : RefreshIndicator(
                          onRefresh: _refresh,
                          color: AppColors.primary,
                          child: LayoutBuilder(
                            builder: (context, constraints) {
                              final isWide = constraints.maxWidth > 600;
                              return CustomScrollView(
                                slivers: [
                                  SliverPadding(
                                    padding: const EdgeInsets.all(AppSpacing.lg),
                                    sliver: SliverToBoxAdapter(
                                      child: Padding(
                                        padding: const EdgeInsets.only(bottom: AppSpacing.md),
                                        child: Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              '${_properties.length} bien${_properties.length > 1 ? 's' : ''} trouvé${_properties.length > 1 ? 's' : ''}',
                                              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                                            ),
                                            if (_searchQuery.isNotEmpty)
                                              AnimatedScaleTap(
                                                onTap: _clearSearch,
                                                child: Container(
                                                  padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 10),
                                                  decoration: BoxDecoration(
                                                    color: AppColors.saleLight,
                                                    borderRadius: BorderRadius.circular(AppRadius.full),
                                                  ),
                                                  constraints: const BoxConstraints(maxWidth: 180),
                                                  child: Row(
                                                    mainAxisSize: MainAxisSize.min,
                                                    children: [
                                                      Flexible(
                                                        child: Text(
                                                          '"$_searchQuery"',
                                                          maxLines: 1,
                                                          overflow: TextOverflow.ellipsis,
                                                          style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600),
                                                        ),
                                                      ),
                                                      const SizedBox(width: 4),
                                                      const Icon(LucideIcons.x, size: 12, color: AppColors.primary),
                                                    ],
                                                  ),
                                                ),
                                              ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                  if (isWide)
                                    SliverPadding(
                                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                                      sliver: SliverGrid(
                                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                          crossAxisCount: 2,
                                          mainAxisSpacing: AppSpacing.lg,
                                          crossAxisSpacing: AppSpacing.lg,
                                          childAspectRatio: 0.72,
                                        ),
                                        delegate: SliverChildBuilderDelegate(
                                          (context, index) {
                                            final property = _properties[index];
                                            return PropertyCard(
                                              property: property,
                                              isFavorite: _favorites.contains(property.id),
                                              onToggleFavorite: _toggleFavorite,
                                            );
                                          },
                                          childCount: _properties.length,
                                        ),
                                      ),
                                    )
                                  else
                                    SliverPadding(
                                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                                      sliver: SliverList(
                                        delegate: SliverChildBuilderDelegate(
                                          (context, index) {
                                            final property = _properties[index];
                                            return PropertyCard(
                                              property: property,
                                              isFavorite: _favorites.contains(property.id),
                                              onToggleFavorite: _toggleFavorite,
                                            );
                                          },
                                          childCount: _properties.length,
                                        ),
                                      ),
                                    ),
                                  const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.xl)),
                                ],
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
}

class _IconButton extends StatelessWidget {
  final IconData icon;
  final bool active;
  final VoidCallback? onTap;

  const _IconButton({required this.icon, this.active = false, this.onTap});

  @override
  Widget build(BuildContext context) {
    return AnimatedScaleTap(
      onTap: onTap,
      child: Container(
        width: 38,
        height: 38,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.surfaceSecondary,
          borderRadius: BorderRadius.circular(AppRadius.sm + 2),
        ),
        child: Icon(icon, size: 20, color: active ? AppColors.primary : AppColors.text),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String searchQuery;
  final VoidCallback onClearSearch;

  const _EmptyState({required this.searchQuery, required this.onClearSearch});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(LucideIcons.mapPin, size: 48, color: AppColors.border),
            const SizedBox(height: AppSpacing.md),
            const Text('Aucun bien trouvé', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.text)),
            const SizedBox(height: AppSpacing.sm),
            Text(
              searchQuery.isNotEmpty
                  ? 'Aucun résultat pour "$searchQuery". Essayez un autre terme.'
                  : 'Essayez de modifier vos filtres pour voir plus de résultats.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
            ),
            if (searchQuery.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.md),
              AnimatedScaleTap(
                onTap: onClearSearch,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm + 2, horizontal: AppSpacing.xl),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(AppRadius.sm + 2),
                  ),
                  child: const Text('Effacer la recherche', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textInverse)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
