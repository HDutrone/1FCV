import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/supabase_client.dart';
import '../../core/theme.dart';
import '../../data/properties_repository.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../providers/subscription_provider.dart';
import '../../widgets/animated_scale_tap.dart';
import '../../widgets/app_badge.dart';
import '../../widgets/app_button.dart';
import '../../widgets/property_image_placeholder.dart';
import '../../widgets/skeleton.dart';

class _StatusInfo {
  final String label;
  final Color color;
  final Color bg;
  final IconData icon;
  const _StatusInfo(this.label, this.color, this.bg, this.icon);
}

const _statusConfig = <String, _StatusInfo>{
  'pending': _StatusInfo('En attente', AppColors.warning, AppColors.warningLight, LucideIcons.clock),
  'approved': _StatusInfo('Approuvée', AppColors.success, AppColors.successLight, LucideIcons.checkCircle),
  'active': _StatusInfo('Active', AppColors.success, AppColors.successLight, LucideIcons.checkCircle),
  'sold': _StatusInfo('Vendu', AppColors.primary, AppColors.saleLight, LucideIcons.checkCircle),
  'rented': _StatusInfo('Loué', AppColors.accent, AppColors.rentLight, LucideIcons.checkCircle),
  'inactive': _StatusInfo('Inactive', AppColors.error, AppColors.errorLight, LucideIcons.xCircle),
};

class MyListingsScreen extends ConsumerStatefulWidget {
  const MyListingsScreen({super.key});

  @override
  ConsumerState<MyListingsScreen> createState() => _MyListingsScreenState();
}

class _MyListingsScreenState extends ConsumerState<MyListingsScreen> {
  bool _loading = true;
  List<Property> _properties = [];
  Map<String, int> _interestCounts = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final ownerId = ref.read(authProvider).user?.id;
    if (ownerId == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    if (mounted) setState(() => _loading = true);
    final properties = await propertiesRepository.fetchOwnerListings(ownerId);
    final counts = await _fetchInterestCounts(properties.map((p) => p.id).toList());
    if (!mounted) return;
    setState(() {
      _properties = properties;
      _interestCounts = counts;
      _loading = false;
    });
  }

  Future<Map<String, int>> _fetchInterestCounts(List<String> propertyIds) async {
    if (propertyIds.isEmpty) return {};
    final data = await supabase.from('tenant_interests').select('id, property_id').inFilter('property_id', propertyIds);
    final counts = <String, int>{};
    for (final row in data as List) {
      final pid = row['property_id'] as String;
      counts[pid] = (counts[pid] ?? 0) + 1;
    }
    return counts;
  }

  @override
  Widget build(BuildContext context) {
    final isPremium = ref.watch(subscriptionProvider).isPremium;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(isPremium),
            Expanded(
              child: _loading
                  ? const RowSkeletonList(count: 5)
                  : _properties.isEmpty
                      ? _buildEmpty()
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(AppSpacing.lg),
                            itemCount: _properties.length,
                            itemBuilder: (context, index) => _ListingCard(
                              property: _properties[index],
                              interestCount: _interestCounts[_properties[index].id] ?? 0,
                            ),
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(bool isPremium) {
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
                const Text('Mes Annonces', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.text)),
                Text(
                  '${_properties.length} annonce${_properties.length != 1 ? 's' : ''}',
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
          if (!isPremium)
            AnimatedScaleTap(
              onTap: () => context.push('/subscription'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
                decoration: BoxDecoration(
                  color: AppColors.accentLight.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(AppRadius.full),
                  border: Border.all(color: AppColors.accent.withValues(alpha: 0.4)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(LucideIcons.crown, size: 14, color: AppColors.accent),
                    SizedBox(width: 4),
                    Text('Premium', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.accent)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Aucune annonce', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.text)),
            const SizedBox(height: AppSpacing.sm),
            const Text(
              'Publiez votre premier bien pour commencer à recevoir des demandes.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
            ),
            const SizedBox(height: AppSpacing.xl),
            AppButton(title: 'Publier un bien', onPressed: () => context.push('/home/publish')),
          ],
        ),
      ),
    );
  }
}

class _ListingCard extends StatelessWidget {
  final Property property;
  final int interestCount;

  const _ListingCard({required this.property, required this.interestCount});

  @override
  Widget build(BuildContext context) {
    final status = _statusConfig[property.status] ?? _statusConfig['pending']!;
    final priceFormat = NumberFormat('#,##0', 'fr_FR');

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.lg),
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(AppRadius.lg), boxShadow: AppShadows.sm),
      child: Column(
        children: [
          AnimatedScaleTap(
            scaleTo: 0.98,
            onTap: () => context.push('/property/${property.id}'),
            child: Container(
              decoration: const BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
              ),
              clipBehavior: Clip.antiAlias,
              child: Row(
                children: [
                  SizedBox(
                    width: 110,
                    height: 130,
                    child: property.primaryImageUrl != null
                        ? CachedNetworkImage(
                            imageUrl: property.primaryImageUrl!,
                            fit: BoxFit.cover,
                            errorWidget: (context, url, error) => const PropertyImagePlaceholder(iconSize: 24),
                          )
                        : const PropertyImagePlaceholder(iconSize: 24),
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              AppBadge(
                                label: property.listingType == 'sale' ? 'Vente' : 'Location',
                                variant: property.listingType == 'sale' ? AppBadgeVariant.sale : AppBadgeVariant.rent,
                                small: true,
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
                          Text(
                            property.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.text),
                          ),
                          Text(property.city?.name ?? '', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '\$${priceFormat.format(property.price)}${property.listingType == 'rent' ? '/mois' : ''}',
                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.primary),
                              ),
                              Row(
                                children: [
                                  const Icon(LucideIcons.eye, size: 12, color: AppColors.textTertiary),
                                  const SizedBox(width: 4),
                                  Text('${property.viewsCount}', style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          AnimatedScaleTap(
            scaleTo: 0.98,
            onTap: () => context.push('/property-interests?propertyId=${property.id}&propertyTitle=${Uri.encodeComponent(property.title)}'),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
              decoration: const BoxDecoration(
                color: AppColors.saleLight,
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(AppRadius.lg)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.users, size: 14, color: AppColors.primary),
                  const SizedBox(width: 6),
                  Text(
                    '$interestCount candidature${interestCount != 1 ? 's' : ''}',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primary),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
