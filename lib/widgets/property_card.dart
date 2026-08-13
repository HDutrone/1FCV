import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../core/theme.dart';
import '../models/models.dart';
import 'animated_scale_tap.dart';
import 'app_badge.dart';
import 'property_image_placeholder.dart';

class PropertyCard extends StatelessWidget {
  final Property property;
  final bool isFavorite;
  final ValueChanged<String>? onToggleFavorite;
  final double? width;

  const PropertyCard({
    super.key,
    required this.property,
    this.isFavorite = false,
    this.onToggleFavorite,
    this.width,
  });

  String _formatPrice() {
    final formatted = NumberFormat('#,##0', 'fr_FR').format(property.price);
    return property.listingType == 'rent' ? '\$$formatted/mois' : '\$$formatted';
  }

  @override
  Widget build(BuildContext context) {
    final location = property.commune != null
        ? '${property.commune!.name}, ${property.city?.name ?? ''}'
        : property.city?.name ?? '';

    return AnimatedScaleTap(
      scaleTo: 0.98,
      onTap: () => context.push('/property/${property.id}'),
      child: Container(
        width: width,
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          boxShadow: AppShadows.md,
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 200,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (property.primaryImageUrl != null)
                    CachedNetworkImage(
                      imageUrl: property.primaryImageUrl!,
                      fit: BoxFit.cover,
                      fadeInDuration: const Duration(milliseconds: 280),
                      placeholder: (context, url) => Container(color: AppColors.surfaceSecondary),
                      errorWidget: (context, url, error) => const PropertyImagePlaceholder(),
                    )
                  else
                    const PropertyImagePlaceholder(),
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Color(0xA6071F36)],
                      ),
                    ),
                  ),
                  Positioned(
                    top: 12,
                    left: 12,
                    right: 12,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        AppBadge(
                          label: property.listingType == 'sale' ? 'À Vendre' : 'À Louer',
                          variant: property.listingType == 'sale' ? AppBadgeVariant.sale : AppBadgeVariant.rent,
                          small: true,
                        ),
                        AnimatedScaleTap(
                          scaleTo: 0.85,
                          onTap: onToggleFavorite == null ? null : () => onToggleFavorite!(property.id),
                          child: Container(
                            width: 34,
                            height: 34,
                            decoration: BoxDecoration(color: const Color(0x66071F36), shape: BoxShape.circle),
                            child: Icon(
                              isFavorite ? Icons.favorite : LucideIcons.heart,
                              size: 18,
                              color: isFavorite ? AppColors.error : AppColors.textInverse,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Positioned(
                    bottom: 12,
                    left: 12,
                    child: Text(
                      _formatPrice(),
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textInverse,
                        shadows: [Shadow(color: Colors.black45, offset: Offset(0, 1), blurRadius: 4)],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    property.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.text),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(LucideIcons.mapPin, size: 12, color: AppColors.textSecondary),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          location,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      if (property.bedrooms > 0) _Stat(icon: LucideIcons.bed, label: '${property.bedrooms} ch.'),
                      if (property.bathrooms > 0) ...[
                        const SizedBox(width: 14),
                        _Stat(icon: LucideIcons.bath, label: '${property.bathrooms} sdb'),
                      ],
                      if (property.surfaceArea > 0) ...[
                        const SizedBox(width: 14),
                        _Stat(icon: LucideIcons.maximize2, label: '${property.surfaceArea.toStringAsFixed(0)} m²'),
                      ],
                    ],
                  ),
                  if (property.isFurnished)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 3, horizontal: 8),
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text('Meublé', style: TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600)),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final IconData icon;
  final String label;

  const _Stat({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.primary),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
      ],
    );
  }
}
