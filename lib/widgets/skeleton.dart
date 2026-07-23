import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../core/theme.dart';

class SkeletonBlock extends StatelessWidget {
  final double? width;
  final double height;
  final double borderRadius;

  const SkeletonBlock({super.key, this.width, this.height = 14, this.borderRadius = AppRadius.sm});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.border,
      highlightColor: AppColors.borderLight,
      period: const Duration(milliseconds: 1400),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(borderRadius)),
      ),
    );
  }
}

class PropertyCardSkeleton extends StatelessWidget {
  const PropertyCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(AppRadius.lg)),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SkeletonBlock(width: double.infinity, height: 200, borderRadius: 0),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SkeletonBlock(width: 160, height: 16),
                const SizedBox(height: 10),
                const SkeletonBlock(width: 100, height: 12),
                const SizedBox(height: 12),
                Row(
                  children: const [
                    SkeletonBlock(width: 50, height: 12),
                    SizedBox(width: 14),
                    SkeletonBlock(width: 50, height: 12),
                    SizedBox(width: 14),
                    SkeletonBlock(width: 50, height: 12),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ListingsSkeletonList extends StatelessWidget {
  final int count;
  const ListingsSkeletonList({super.key, this.count = 4});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: List.generate(count, (_) => const PropertyCardSkeleton()),
    );
  }
}

class RowSkeleton extends StatelessWidget {
  const RowSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(AppRadius.lg)),
      child: Row(
        children: [
          const SkeletonBlock(width: 44, height: 44, borderRadius: AppRadius.md),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                SkeletonBlock(width: 140, height: 14),
                SizedBox(height: 8),
                SkeletonBlock(width: 90, height: 12),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class RowSkeletonList extends StatelessWidget {
  final int count;
  const RowSkeletonList({super.key, this.count = 5});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: List.generate(count, (_) => const RowSkeleton()),
    );
  }
}
