import 'package:flutter/material.dart';
import '../core/theme.dart';
import 'animated_scale_tap.dart';

enum AppButtonVariant { primary, secondary, outline, ghost, danger }

enum AppButtonSize { sm, md, lg }

class AppButton extends StatelessWidget {
  final String title;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final bool loading;
  final EdgeInsetsGeometry? margin;

  const AppButton({
    super.key,
    required this.title,
    required this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.md,
    this.loading = false,
    this.margin,
  });

  double get _verticalPadding => switch (size) { AppButtonSize.sm => 8, AppButtonSize.md => 14, AppButtonSize.lg => 18 };
  double get _fontSize => switch (size) { AppButtonSize.sm => 13, AppButtonSize.md => 15, AppButtonSize.lg => 17 };
  double get _radius => switch (size) { AppButtonSize.sm => AppRadius.sm, AppButtonSize.md => AppRadius.md, AppButtonSize.lg => AppRadius.lg };

  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null || loading;
    final content = loading
        ? SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: variant == AppButtonVariant.outline || variant == AppButtonVariant.ghost
                  ? AppColors.primary
                  : AppColors.textInverse,
            ),
          )
        : Text(
            title,
            style: TextStyle(
              fontSize: _fontSize,
              fontWeight: FontWeight.w700,
              color: _textColor,
            ),
          );

    Widget button = Container(
      margin: margin,
      padding: EdgeInsets.symmetric(vertical: _verticalPadding, horizontal: size == AppButtonSize.lg ? 32 : 24),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(_radius),
        gradient: _gradient,
        color: _gradient == null ? _backgroundColor : null,
        border: variant == AppButtonVariant.outline ? Border.all(color: AppColors.primary, width: 1.5) : null,
      ),
      child: content,
    );

    if (disabled) {
      return Opacity(opacity: 0.5, child: button);
    }

    return AnimatedScaleTap(onTap: onPressed, child: button);
  }

  LinearGradient? get _gradient {
    if (variant == AppButtonVariant.primary) {
      return const LinearGradient(colors: AppColors.gradientPrimary, begin: Alignment.topLeft, end: Alignment.bottomRight);
    }
    if (variant == AppButtonVariant.secondary) {
      return const LinearGradient(colors: AppColors.gradientAccent, begin: Alignment.topLeft, end: Alignment.bottomRight);
    }
    return null;
  }

  Color get _backgroundColor => switch (variant) {
        AppButtonVariant.danger => AppColors.error,
        AppButtonVariant.outline => Colors.transparent,
        AppButtonVariant.ghost => Colors.transparent,
        _ => AppColors.primary,
      };

  Color get _textColor => switch (variant) {
        AppButtonVariant.outline => AppColors.primary,
        AppButtonVariant.ghost => AppColors.primary,
        _ => AppColors.textInverse,
      };
}
