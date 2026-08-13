import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../core/theme.dart';

class PropertyImagePlaceholder extends StatelessWidget {
  final double iconSize;

  const PropertyImagePlaceholder({super.key, this.iconSize = 40});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: AppColors.gradientPrimary,
        ),
      ),
      alignment: Alignment.center,
      child: Icon(LucideIcons.imageOff, size: iconSize, color: AppColors.textInverse.withValues(alpha: 0.55)),
    );
  }
}
