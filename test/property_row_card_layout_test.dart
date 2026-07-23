import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons/lucide_icons.dart';

import 'package:app/core/theme.dart';
import 'package:app/models/models.dart';
import 'package:app/widgets/animated_scale_tap.dart';
import 'package:app/widgets/app_badge.dart';
import 'package:app/widgets/property_image_placeholder.dart';

// Mirrors _ListingCard's widget tree (my_listings_screen.dart) and
// _RequestCard's equivalent (my_requests_screen.dart): a Row with a
// fixed-width image thumbnail and an Expanded text column. Regression
// guard for a real bug where CrossAxisAlignment.stretch on that Row threw
// "BoxConstraints forces an infinite height" once placed inside a
// ListView.builder (which gives list items unbounded height), silently
// blanking the whole list in release mode while item counts elsewhere
// (fed by list length, not by the broken render tree) still looked right.
Widget buildListingCardLike(Property property, int interestCount) {
  return Container(
    margin: const EdgeInsets.only(bottom: AppSpacing.lg),
    decoration: BoxDecoration(borderRadius: BorderRadius.circular(AppRadius.lg), boxShadow: AppShadows.sm),
    child: Column(
      children: [
        AnimatedScaleTap(
          scaleTo: 0.98,
          onTap: () {},
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
                            Text('\$${property.price}${property.listingType == 'rent' ? '/mois' : ''}'),
                            Row(children: [
                              const Icon(LucideIcons.eye, size: 12, color: AppColors.textTertiary),
                              Text('${property.viewsCount}'),
                            ]),
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
        Text('$interestCount candidatures'),
      ],
    ),
  );
}

void main() {
  testWidgets('listing card renders visible title text inside a bounded ListView', (tester) async {
    final property = Property(
      id: 'p1',
      ownerId: 'owner1',
      listingType: 'rent',
      title: 'Villa cozzi',
      description: '',
      price: 500,
      currency: 'USD',
      bedrooms: 3,
      bathrooms: 1,
      surfaceArea: 120,
      addressHint: '',
      propertyType: 'villa',
      status: 'active',
      isFurnished: true,
      hasGarage: true,
      hasPool: true,
      hasGarden: true,
      hasSecurity: true,
      keywords: const [],
      viewsCount: 1,
      createdAt: DateTime.now().toIso8601String(),
      city: City(id: 'c1', name: 'Kinshasa'),
      images: const [],
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ListView.builder(
            itemCount: 1,
            itemBuilder: (context, index) => buildListingCardLike(property, 3),
          ),
        ),
      ),
    );
    await tester.pump();

    expect(find.text('Villa cozzi'), findsOneWidget);
    expect(find.text('3 candidatures'), findsOneWidget);

    final renderBox = tester.renderObject(find.text('Villa cozzi')) as RenderBox;
    print('title paintBounds size: ${renderBox.size}');
    expect(renderBox.size.width, greaterThan(0));
    expect(renderBox.size.height, greaterThan(0));
  });
}
