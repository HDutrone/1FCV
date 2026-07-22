import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/supabase_client.dart';
import '../../core/theme.dart';
import '../../data/conversations_repository.dart';
import '../../data/favorites_repository.dart';
import '../../data/properties_repository.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/animated_scale_tap.dart';
import '../../widgets/app_badge.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_input.dart';
import '../../widgets/property_card.dart';
import '../../widgets/property_image_placeholder.dart';
import '../../widgets/skeleton.dart';

class _InterestStatusConfig {
  final String label;
  final Color color;
  final Color bg;
  final IconData icon;
  final String description;

  const _InterestStatusConfig({
    required this.label,
    required this.color,
    required this.bg,
    required this.icon,
    required this.description,
  });
}

const _interestStatusConfig = <String, _InterestStatusConfig>{
  'pending': _InterestStatusConfig(
    label: 'En attente',
    color: AppColors.warning,
    bg: AppColors.warningLight,
    icon: LucideIcons.clock,
    description: 'Votre demande est en cours de traitement par le propriétaire.',
  ),
  'reviewed': _InterestStatusConfig(
    label: 'Examinée',
    color: AppColors.info,
    bg: AppColors.infoLight,
    icon: LucideIcons.eye,
    description: 'Le propriétaire a pris connaissance de votre demande.',
  ),
  'accepted': _InterestStatusConfig(
    label: 'Mis en relation',
    color: AppColors.success,
    bg: AppColors.successLight,
    icon: LucideIcons.heartHandshake,
    description: 'Félicitations ! Votre profil a été retenu. Vous pouvez désormais échanger.',
  ),
  'rejected': _InterestStatusConfig(
    label: 'Non retenu',
    color: AppColors.error,
    bg: AppColors.errorLight,
    icon: LucideIcons.x,
    description: "Votre candidature n'a pas été retenue pour ce bien.",
  ),
};

class PropertyDetailScreen extends ConsumerStatefulWidget {
  final String propertyId;

  const PropertyDetailScreen({super.key, required this.propertyId});

  @override
  ConsumerState<PropertyDetailScreen> createState() => _PropertyDetailScreenState();
}

class _PropertyDetailScreenState extends ConsumerState<PropertyDetailScreen> {
  Property? _property;
  bool _loading = true;
  bool _isFavorite = false;
  Set<String> _favorites = {};
  String? _interestStatus;
  List<Property> _similarProperties = [];
  int _activeImageIndex = 0;
  final _pageController = PageController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final property = await propertiesRepository.fetchPropertyById(widget.propertyId);
      if (property == null) {
        if (mounted) setState(() => _loading = false);
        return;
      }

      // View-count increment is only permitted by RLS for the property's
      // owner; for every other viewer it's expected to fail. It's a
      // best-effort analytics call, so it must never block the page load.
      try {
        await propertiesRepository.incrementViews(property.id, property.viewsCount);
      } catch (_) {
        // Ignored: non-owners cannot update views_count, and that's fine.
      }

      final userId = ref.read(authProvider).user?.id;
      final futures = <Future>[
        propertiesRepository.fetchSimilar(property),
        if (userId != null) favoritesRepository.fetchFavoriteIds(userId) else Future.value(<String>{}),
        if (userId != null)
          supabase
              .from('tenant_interests')
              .select('id, status')
              .eq('tenant_id', userId)
              .eq('property_id', widget.propertyId)
              .maybeSingle()
        else
          Future.value(null),
      ];

      final results = await Future.wait(futures);
      if (!mounted) return;

      final favorites = results[1] as Set<String>;
      final interest = results[2] as Map<String, dynamic>?;

      setState(() {
        _property = property;
        _similarProperties = results[0] as List<Property>;
        _favorites = favorites;
        _isFavorite = favorites.contains(property.id);
        _interestStatus = interest?['status'] as String?;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggleFavorite() async {
    final user = ref.read(authProvider).user;
    if (user == null) {
      context.push('/login');
      return;
    }
    final property = _property;
    if (property == null) return;
    setState(() => _isFavorite = !_isFavorite);
    if (_isFavorite) {
      _favorites.add(property.id);
      await favoritesRepository.addFavorite(user.id, property.id);
    } else {
      _favorites.remove(property.id);
      await favoritesRepository.removeFavorite(user.id, property.id);
    }
  }

  Future<void> _toggleSimilarFavorite(String propertyId) async {
    final user = ref.read(authProvider).user;
    if (user == null) return;
    final isFav = _favorites.contains(propertyId);
    setState(() {
      if (isFav) {
        _favorites.remove(propertyId);
      } else {
        _favorites.add(propertyId);
      }
    });
    if (isFav) {
      await favoritesRepository.removeFavorite(user.id, propertyId);
    } else {
      await favoritesRepository.addFavorite(user.id, propertyId);
    }
  }

  Future<void> _openInterestConversation() async {
    final user = ref.read(authProvider).user;
    final property = _property;
    if (user == null || property == null) return;
    final conv = await conversationsRepository.findConversationForTenant(property.id, user.id);
    if (conv != null && mounted) context.push('/conversation/${conv['id']}');
  }

  Future<void> _submitInterest(String message) async {
    final user = ref.read(authProvider).user;
    final property = _property;
    if (user == null || property == null) return;

    final interest = await supabase
        .from('tenant_interests')
        .insert({'tenant_id': user.id, 'property_id': property.id, 'message': message})
        .select()
        .maybeSingle();

    if (interest == null) return;

    final adminProfile = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).maybeSingle();
    final adminId = adminProfile?['id'] as String?;

    final searcherConv = await supabase
        .from('conversations')
        .insert({
          'property_id': property.id,
          'tenant_id': user.id,
          'owner_id': adminId ?? property.ownerId,
          'interest_id': interest['id'],
          'status': 'active',
          'conversation_type': 'searcher_admin',
          'admin_id': adminId,
        })
        .select()
        .maybeSingle();

    if (searcherConv != null && adminId != null) {
      final ownerConv = await supabase
          .from('conversations')
          .insert({
            'property_id': property.id,
            'tenant_id': adminId,
            'owner_id': property.ownerId,
            'interest_id': interest['id'],
            'status': 'active',
            'conversation_type': 'owner_admin',
            'admin_id': adminId,
            'related_conversation_id': searcherConv['id'],
          })
          .select()
          .maybeSingle();

      if (ownerConv != null) {
        await supabase.from('conversations').update({'related_conversation_id': ownerConv['id']}).eq('id', searcherConv['id']);
      }
    }

    if (mounted) setState(() => _interestStatus = 'pending');
  }

  void _openInterestSheet() {
    final user = ref.read(authProvider).user;
    if (user == null) {
      context.push('/login');
      return;
    }
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _InterestSheet(onSubmit: _submitInterest),
    );
  }

  String _formatPrice(double price, String type) {
    final formatted = NumberFormat('#,##0', 'fr_FR').format(price);
    return type == 'rent' ? '\$$formatted/mois' : '\$$formatted';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        backgroundColor: AppColors.surface,
        body: Column(
          children: [
            const SkeletonBlock(width: double.infinity, height: 320, borderRadius: 0),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.xl),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  SkeletonBlock(width: 140, height: 26),
                  SizedBox(height: AppSpacing.md),
                  SkeletonBlock(width: 260, height: 18),
                  SizedBox(height: AppSpacing.md),
                  SkeletonBlock(width: 180, height: 14),
                ],
              ),
            ),
          ],
        ),
      );
    }

    final property = _property;
    if (property == null) {
      return Scaffold(
        backgroundColor: AppColors.surface,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Bien introuvable', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.text)),
              const SizedBox(height: AppSpacing.sm),
              GestureDetector(
                onTap: () => context.pop(),
                child: const Text('Retour', style: TextStyle(fontSize: 14, color: AppColors.primary, decoration: TextDecoration.underline)),
              ),
            ],
          ),
        ),
      );
    }

    final images = property.orderedImageUrls;
    final location = property.commune != null
        ? '${property.commune!.name}, ${property.city?.name ?? ''}'
        : property.city?.name ?? '';
    final amenities = [
      if (property.isFurnished) (icon: LucideIcons.checkCircle2, label: 'Meublé'),
      if (property.hasGarage) (icon: LucideIcons.car, label: 'Garage'),
      if (property.hasPool) (icon: LucideIcons.waves, label: 'Piscine'),
      if (property.hasGarden) (icon: LucideIcons.trees, label: 'Jardin'),
      if (property.hasSecurity) (icon: LucideIcons.shield, label: 'Sécurité'),
    ];
    final statusConf = _interestStatus != null ? _interestStatusConfig[_interestStatus] : null;
    final criteria = property.ownerCriteria;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: Stack(
        children: [
          Positioned.fill(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _Gallery(
                    images: images,
                    activeIndex: _activeImageIndex,
                    controller: _pageController,
                    onPageChanged: (i) => setState(() => _activeImageIndex = i),
                    onBack: () => context.pop(),
                    onToggleFavorite: _toggleFavorite,
                    isFavorite: _isFavorite,
                    listingType: property.listingType,
                  ),
                  Padding(
                    padding: const EdgeInsets.all(AppSpacing.xl),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              _formatPrice(property.price, property.listingType),
                              style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.primary),
                            ),
                            Row(
                              children: [
                                const Icon(LucideIcons.eye, size: 13, color: AppColors.textTertiary),
                                const SizedBox(width: 4),
                                Text('${property.viewsCount} vues', style: const TextStyle(fontSize: 12, color: AppColors.textTertiary)),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(property.title, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700, color: AppColors.text)),
                        const SizedBox(height: AppSpacing.sm),
                        Row(
                          children: [
                            const Icon(LucideIcons.mapPin, size: 14, color: AppColors.primary),
                            const SizedBox(width: 4),
                            Expanded(child: Text(location, style: const TextStyle(fontSize: 14, color: AppColors.textSecondary))),
                          ],
                        ),
                        if (property.addressHint.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(property.addressHint, style: const TextStyle(fontSize: 13, color: AppColors.textTertiary)),
                        ],
                        const SizedBox(height: AppSpacing.lg),
                        Row(
                          children: [
                            if (property.bedrooms > 0)
                              Expanded(
                                child: _StatCard(
                                  icon: LucideIcons.bed,
                                  value: '${property.bedrooms}',
                                  label: 'Chambre${property.bedrooms > 1 ? 's' : ''}',
                                ),
                              ),
                            if (property.bedrooms > 0 && property.bathrooms > 0) const SizedBox(width: AppSpacing.sm),
                            if (property.bathrooms > 0)
                              Expanded(
                                child: _StatCard(
                                  icon: LucideIcons.bath,
                                  value: '${property.bathrooms}',
                                  label: 'Salle${property.bathrooms > 1 ? 's' : ''} de bain',
                                ),
                              ),
                            if (property.surfaceArea > 0 && (property.bedrooms > 0 || property.bathrooms > 0))
                              const SizedBox(width: AppSpacing.sm),
                            if (property.surfaceArea > 0)
                              Expanded(
                                child: _StatCard(
                                  icon: LucideIcons.maximize2,
                                  value: property.surfaceArea.toStringAsFixed(0),
                                  label: 'm²',
                                ),
                              ),
                          ],
                        ),
                        if (statusConf != null) ...[
                          const SizedBox(height: AppSpacing.lg),
                          _InterestStatusCard(config: statusConf, onOpenChat: _interestStatus == 'accepted' ? _openInterestConversation : null),
                        ],
                        if (property.description.isNotEmpty) ...[
                          const SizedBox(height: AppSpacing.xl),
                          const _SectionTitle('Description'),
                          Text(property.description, style: const TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.6)),
                        ],
                        if (amenities.isNotEmpty) ...[
                          const SizedBox(height: AppSpacing.xl),
                          const _SectionTitle('Équipements & Caractéristiques'),
                          Wrap(
                            spacing: AppSpacing.sm,
                            runSpacing: AppSpacing.sm,
                            children: [
                              for (final a in amenities)
                                Container(
                                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                                  decoration: BoxDecoration(
                                    color: AppColors.successLight,
                                    borderRadius: BorderRadius.circular(AppRadius.full),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(a.icon, size: 14, color: AppColors.success),
                                      const SizedBox(width: 6),
                                      Text(a.label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.success)),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                        ],
                        if (property.keywords.isNotEmpty) ...[
                          const SizedBox(height: AppSpacing.xl),
                          const _SectionTitle('Mots-clés'),
                          Wrap(
                            spacing: AppSpacing.sm,
                            runSpacing: AppSpacing.sm,
                            children: [
                              for (final kw in property.keywords)
                                Container(
                                  padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
                                  decoration: BoxDecoration(
                                    color: AppColors.surfaceSecondary,
                                    borderRadius: BorderRadius.circular(AppRadius.full),
                                  ),
                                  child: Text(kw, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                ),
                            ],
                          ),
                        ],
                        if (criteria != null) ...[
                          const SizedBox(height: AppSpacing.xl),
                          _OwnerCriteriaSection(criteria: criteria, listingType: property.listingType),
                        ],
                        const SizedBox(height: AppSpacing.xl),
                        Container(
                          padding: const EdgeInsets.all(AppSpacing.md),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceSecondary,
                            borderRadius: BorderRadius.circular(AppRadius.md),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(LucideIcons.lock, size: 14, color: AppColors.primary),
                              const SizedBox(width: AppSpacing.sm),
                              const Expanded(
                                child: Text(
                                  "Toutes les communications se font exclusivement via 1 Futur Chez Vous. "
                                  "Votre identité reste protégée jusqu'à la signature du contrat.",
                                  style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.5),
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (_similarProperties.isNotEmpty) ...[
                          const SizedBox(height: AppSpacing.xl),
                          const _SectionTitle('Biens similaires'),
                        ],
                      ],
                    ),
                  ),
                  if (_similarProperties.isNotEmpty)
                    SizedBox(
                      height: 300,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
                        itemCount: _similarProperties.length,
                        itemBuilder: (context, index) {
                          final similar = _similarProperties[index];
                          return Padding(
                            padding: const EdgeInsets.only(right: AppSpacing.md),
                            child: PropertyCard(
                              property: similar,
                              isFavorite: _favorites.contains(similar.id),
                              onToggleFavorite: _toggleSimilarFavorite,
                              width: MediaQuery.of(context).size.width * 0.72,
                            ),
                          );
                        },
                      ),
                    ),
                  const SizedBox(height: 110),
                ],
              ),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _Footer(
              property: property,
              statusConf: statusConf,
              formattedPrice: _formatPrice(property.price, property.listingType),
              onExpressInterest: _openInterestSheet,
            ),
          ),
        ],
      ),
    );
  }
}

class _Gallery extends StatelessWidget {
  final List<String> images;
  final int activeIndex;
  final PageController controller;
  final ValueChanged<int> onPageChanged;
  final VoidCallback onBack;
  final VoidCallback onToggleFavorite;
  final bool isFavorite;
  final String listingType;

  const _Gallery({
    required this.images,
    required this.activeIndex,
    required this.controller,
    required this.onPageChanged,
    required this.onBack,
    required this.onToggleFavorite,
    required this.isFavorite,
    required this.listingType,
  });

  void _goTo(int index) {
    controller.animateToPage(index, duration: const Duration(milliseconds: 280), curve: Curves.easeOut);
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 320,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (images.isEmpty)
            const PropertyImagePlaceholder(iconSize: 56)
          else
            PageView.builder(
              controller: controller,
              itemCount: images.length,
              onPageChanged: onPageChanged,
              itemBuilder: (context, index) => CachedNetworkImage(
                imageUrl: images[index],
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(color: AppColors.surfaceSecondary),
                errorWidget: (context, url, error) => const PropertyImagePlaceholder(iconSize: 56),
              ),
            ),
          IgnorePointer(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0x59000000), Colors.transparent],
                  stops: [0.0, 0.35],
                ),
              ),
            ),
          ),
          IgnorePointer(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Color(0x99000000)],
                  stops: [0.55, 1.0],
                ),
              ),
            ),
          ),
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  AnimatedScaleTap(
                    scaleTo: 0.88,
                    onTap: onBack,
                    child: Container(
                      width: 40,
                      height: 40,
                      alignment: Alignment.center,
                      decoration: const BoxDecoration(color: Color(0x66000000), shape: BoxShape.circle),
                      child: const Icon(LucideIcons.arrowLeft, size: 20, color: AppColors.textInverse),
                    ),
                  ),
                  AnimatedScaleTap(
                    scaleTo: 0.85,
                    onTap: onToggleFavorite,
                    child: Container(
                      width: 40,
                      height: 40,
                      alignment: Alignment.center,
                      decoration: const BoxDecoration(color: Color(0x66000000), shape: BoxShape.circle),
                      child: Icon(
                        isFavorite ? Icons.favorite : LucideIcons.heart,
                        size: 20,
                        color: isFavorite ? AppColors.error : AppColors.textInverse,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (images.length > 1) ...[
            Positioned(
              left: AppSpacing.sm,
              top: 0,
              bottom: 0,
              child: Center(
                child: _GalleryArrow(
                  icon: LucideIcons.chevronLeft,
                  enabled: activeIndex > 0,
                  onTap: () => _goTo(activeIndex - 1),
                ),
              ),
            ),
            Positioned(
              right: AppSpacing.sm,
              top: 0,
              bottom: 0,
              child: Center(
                child: _GalleryArrow(
                  icon: LucideIcons.chevronRight,
                  enabled: activeIndex < images.length - 1,
                  onTap: () => _goTo(activeIndex + 1),
                ),
              ),
            ),
            Positioned(
              bottom: 52,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (int i = 0; i < images.length; i++)
                    Container(
                      width: i == activeIndex ? 18 : 6,
                      height: 6,
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      decoration: BoxDecoration(
                        color: i == activeIndex ? AppColors.textInverse : AppColors.textInverse.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(AppRadius.full),
                      ),
                    ),
                ],
              ),
            ),
          ],
          Positioned(
            left: AppSpacing.lg,
            right: AppSpacing.lg,
            bottom: AppSpacing.md,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                AppBadge(
                  label: listingType == 'sale' ? 'À Vendre' : 'À Louer',
                  variant: listingType == 'sale' ? AppBadgeVariant.sale : AppBadgeVariant.rent,
                ),
                if (images.length > 1)
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 3, horizontal: 8),
                    decoration: BoxDecoration(color: const Color(0x66000000), borderRadius: BorderRadius.circular(AppRadius.sm)),
                    child: Text(
                      '${activeIndex + 1}/${images.length}',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textInverse),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _GalleryArrow extends StatelessWidget {
  final IconData icon;
  final bool enabled;
  final VoidCallback onTap;

  const _GalleryArrow({required this.icon, required this.enabled, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1 : 0.35,
      child: AnimatedScaleTap(
        scaleTo: 0.85,
        onTap: enabled ? onTap : null,
        child: Container(
          width: 34,
          height: 34,
          alignment: Alignment.center,
          decoration: const BoxDecoration(color: Color(0x59000000), shape: BoxShape.circle),
          child: Icon(icon, size: 22, color: AppColors.textInverse),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;

  const _StatCard({required this.icon, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surfaceSecondary,
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Column(
        children: [
          Icon(icon, size: 20, color: AppColors.primary),
          const SizedBox(height: 6),
          Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.text)),
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.text)),
    );
  }
}

class _InterestStatusCard extends StatelessWidget {
  final _InterestStatusConfig config;
  final VoidCallback? onOpenChat;

  const _InterestStatusCard({required this.config, this.onOpenChat});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: config.color.withValues(alpha: 0.35)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm, horizontal: AppSpacing.md),
            color: config.bg,
            child: Row(
              children: [
                Icon(config.icon, size: 16, color: config.color),
                const SizedBox(width: AppSpacing.sm),
                Text(config.label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: config.color)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(config.description, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.5)),
                if (onOpenChat != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  AnimatedScaleTap(
                    onTap: onOpenChat,
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm, horizontal: AppSpacing.md),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(AppRadius.sm),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(LucideIcons.messageCircle, size: 14, color: AppColors.textInverse),
                          SizedBox(width: 6),
                          Text('Ouvrir la conversation', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textInverse)),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OwnerCriteriaSection extends StatelessWidget {
  final OwnerCriteria criteria;
  final String listingType;

  const _OwnerCriteriaSection({required this.criteria, required this.listingType});

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat('#,##0', 'fr_FR');
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surfaceSecondary,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(LucideIcons.lock, size: 16, color: AppColors.primary),
              SizedBox(width: AppSpacing.sm),
              Text('Critères du propriétaire', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.text)),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'Vérifiez que votre profil correspond à ces critères avant de manifester votre intérêt.',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.5),
          ),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.lg,
            runSpacing: AppSpacing.md,
            children: [
              if (criteria.minMonthlyIncome != null)
                _CriteriaItem(
                  icon: LucideIcons.dollarSign,
                  label: 'Revenu min./mois',
                  value: '\$${currency.format(criteria.minMonthlyIncome)}',
                ),
              _CriteriaItem(
                icon: LucideIcons.users,
                label: 'Occupants max.',
                value: '${criteria.maxOccupants} personnes',
              ),
              if (listingType == 'rent')
                _CriteriaItem(
                  icon: LucideIcons.calendar,
                  label: "Mois d'avance",
                  value: '${criteria.advanceMonths} mois',
                ),
              if (listingType == 'rent')
                _CriteriaItem(
                  icon: LucideIcons.calendar,
                  label: 'Durée min.',
                  value: '${criteria.minStayMonths} mois',
                ),
              _CriteriaItem(
                icon: LucideIcons.dog,
                label: 'Animaux',
                value: criteria.petsAllowed ? 'Acceptés' : 'Non acceptés',
                positive: criteria.petsAllowed,
              ),
              _CriteriaItem(
                icon: LucideIcons.cigarette,
                label: 'Fumeurs',
                value: criteria.smokingAllowed ? 'Acceptés' : 'Non acceptés',
                positive: criteria.smokingAllowed,
              ),
              if (criteria.requiresGuarantor)
                const _CriteriaItem(icon: LucideIcons.fileText, label: 'Caution', value: 'Requise'),
            ],
          ),
          if (criteria.allowedProfiles.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            const Text('Profils recherchés :', style: TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: [
                for (final profile in criteria.allowedProfiles)
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 10),
                    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(AppRadius.sm)),
                    child: Text(profile, style: const TextStyle(fontSize: 12, color: AppColors.text)),
                  ),
              ],
            ),
          ],
          if (criteria.additionalRequirements.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(LucideIcons.alertCircle, size: 14, color: AppColors.warning),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    criteria.additionalRequirements,
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.5),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _CriteriaItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final bool? positive;

  const _CriteriaItem({required this.icon, required this.label, required this.value, this.positive});

  @override
  Widget build(BuildContext context) {
    final valueColor = positive == null ? AppColors.text : (positive! ? AppColors.success : AppColors.error);
    return SizedBox(
      width: 150,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 14, color: AppColors.textSecondary),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textTertiary, fontWeight: FontWeight.w500)),
                const SizedBox(height: 1),
                Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: valueColor)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Footer extends StatelessWidget {
  final Property property;
  final _InterestStatusConfig? statusConf;
  final String formattedPrice;
  final VoidCallback onExpressInterest;

  const _Footer({
    required this.property,
    required this.statusConf,
    required this.formattedPrice,
    required this.onExpressInterest,
  });

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.surface,
        boxShadow: AppShadows.lg,
        border: const Border(top: BorderSide(color: AppColors.border)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, AppSpacing.md),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      property.listingType == 'rent' ? 'Loyer mensuel' : 'Prix de vente',
                      style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                    ),
                    Text(formattedPrice, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.primary)),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              if (statusConf != null)
                Container(
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.md, horizontal: AppSpacing.lg),
                  decoration: BoxDecoration(
                    color: statusConf!.bg,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    border: Border.all(color: statusConf!.color.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(statusConf!.icon, size: 18, color: statusConf!.color),
                      const SizedBox(width: AppSpacing.sm),
                      Text(statusConf!.label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: statusConf!.color)),
                    ],
                  ),
                )
              else
                AnimatedScaleTap(
                  onTap: onExpressInterest,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: AppSpacing.md, horizontal: AppSpacing.lg),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: AppColors.gradientPrimary, begin: Alignment.topLeft, end: Alignment.bottomRight),
                      borderRadius: BorderRadius.circular(AppRadius.md),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(LucideIcons.messageCircle, size: 18, color: AppColors.textInverse),
                        SizedBox(width: AppSpacing.sm),
                        Text('Manifester mon intérêt', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textInverse)),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InterestSheet extends StatefulWidget {
  final Future<void> Function(String message) onSubmit;

  const _InterestSheet({required this.onSubmit});

  @override
  State<_InterestSheet> createState() => _InterestSheetState();
}

class _InterestSheetState extends State<_InterestSheet> {
  final _messageController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    await widget.onSubmit(_messageController.text.trim());
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SafeArea(
        top: false,
        child: DecoratedBox(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xxl)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(AppSpacing.xl),
                decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.border))),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Manifester votre intérêt', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.text)),
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: const Icon(LucideIcons.x, size: 22, color: AppColors.text),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AppSpacing.xl),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceSecondary,
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Icon(LucideIcons.lock, size: 14, color: AppColors.primary),
                          SizedBox(width: AppSpacing.sm),
                          Expanded(
                            child: Text(
                              "Votre demande sera traitée par l'administrateur de 1 Futur Chez Vous. "
                              "Vous ne communiquerez jamais directement avec le propriétaire - notre équipe assure la médiation.",
                              style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.5),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    AppInput(
                      label: 'Message (optionnel)',
                      placeholder: 'Présentez-vous brièvement et expliquez votre intérêt pour ce bien...',
                      controller: _messageController,
                      multiline: true,
                      maxLines: 4,
                    ),
                    AppButton(
                      title: 'Envoyer ma demande',
                      size: AppButtonSize.lg,
                      loading: _submitting,
                      onPressed: _submitting ? null : _submit,
                    ),
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
