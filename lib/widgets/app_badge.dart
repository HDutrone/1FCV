import 'package:flutter/material.dart';
import '../core/theme.dart';

enum AppBadgeVariant { sale, rent, success, warning, error, info, neutral }

class AppBadge extends StatelessWidget {
  final String label;
  final AppBadgeVariant variant;
  final bool small;

  const AppBadge({super.key, required this.label, this.variant = AppBadgeVariant.neutral, this.small = false});

  Color get _bg => switch (variant) {
        AppBadgeVariant.sale => AppColors.saleLight,
        AppBadgeVariant.rent => AppColors.rentLight,
        AppBadgeVariant.success => AppColors.successLight,
        AppBadgeVariant.warning => AppColors.warningLight,
        AppBadgeVariant.error => AppColors.errorLight,
        AppBadgeVariant.info => AppColors.infoLight,
        AppBadgeVariant.neutral => AppColors.surfaceSecondary,
      };

  Color get _fg => switch (variant) {
        AppBadgeVariant.sale => AppColors.sale,
        AppBadgeVariant.rent => AppColors.accent,
        AppBadgeVariant.success => AppColors.success,
        AppBadgeVariant.warning => AppColors.warning,
        AppBadgeVariant.error => AppColors.error,
        AppBadgeVariant.info => AppColors.info,
        AppBadgeVariant.neutral => AppColors.textSecondary,
      };

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: small ? 2 : 4, horizontal: small ? 7 : 10),
      decoration: BoxDecoration(color: _bg, borderRadius: BorderRadius.circular(6)),
      child: Text(
        label,
        style: TextStyle(color: _fg, fontWeight: FontWeight.w700, fontSize: small ? 10 : 11, letterSpacing: 0.3),
      ),
    );
  }
}
