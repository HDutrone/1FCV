import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  AppColors._();

  static const primary = Color(0xFF0F3D68);
  static const primaryDark = Color(0xFF071F36);
  static const primaryLight = Color(0xFF2E6DB4);

  static const accent = Color(0xFFC9962B);
  static const accentLight = Color(0xFFE0B85C);
  static const accentDark = Color(0xFF9C7420);

  static const background = Color(0xFFF6F7FA);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceSecondary = Color(0xFFF1F3F7);

  static const text = Color(0xFF161B26);
  static const textSecondary = Color(0xFF5B6472);
  static const textTertiary = Color(0xFF9AA1AC);
  static const textInverse = Color(0xFFFFFFFF);

  static const border = Color(0xFFE4E7ED);
  static const borderLight = Color(0xFFF0F2F5);

  static const success = Color(0xFF10B981);
  static const successLight = Color(0xFFD1FAE5);
  static const error = Color(0xFFEF4444);
  static const errorLight = Color(0xFFFEE2E2);
  static const warning = Color(0xFFF59E0B);
  static const warningLight = Color(0xFFFEF3C7);
  static const info = Color(0xFF3B82F6);
  static const infoLight = Color(0xFFDBEAFE);

  static const sale = primary;
  static const saleLight = Color(0xFFE1EAF3);
  static const rent = accentDark;
  static const rentLight = Color(0xFFF5EACB);

  static const overlay = Color(0x66000000);
  static const overlayLight = Color(0x26000000);
  static const overlayDark = Color(0x99000000);

  static const gradientPrimary = [primaryDark, primary];
  static const gradientPrimaryDeep = [primaryDark, primary, primaryLight];
  static const gradientAccent = [accentLight, accentDark];
}

class AppSpacing {
  AppSpacing._();
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 20.0;
  static const xxl = 24.0;
  static const xxxl = 32.0;
}

class AppRadius {
  AppRadius._();
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 20.0;
  static const xxl = 24.0;
  static const full = 999.0;
}

class AppShadows {
  AppShadows._();

  static List<BoxShadow> sm = [
    BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.06), offset: const Offset(0, 2), blurRadius: 6),
  ];

  static List<BoxShadow> md = [
    BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.10), offset: const Offset(0, 4), blurRadius: 12),
  ];

  static List<BoxShadow> lg = [
    BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.16), offset: const Offset(0, 10), blurRadius: 22),
  ];

  static List<BoxShadow> gold = [
    BoxShadow(color: AppColors.accentDark.withValues(alpha: 0.32), offset: const Offset(0, 6), blurRadius: 14),
  ];
}

ThemeData buildAppTheme() {
  final baseTextTheme = GoogleFonts.plusJakartaSansTextTheme();

  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: AppColors.background,
    fontFamily: GoogleFonts.plusJakartaSans().fontFamily,
    textTheme: baseTextTheme.apply(
      bodyColor: AppColors.text,
      displayColor: AppColors.text,
    ),
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      primary: AppColors.primary,
      secondary: AppColors.accent,
      error: AppColors.error,
      surface: AppColors.surface,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.surface,
      foregroundColor: AppColors.text,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
    ),
    splashFactory: InkRipple.splashFactory,
    dividerColor: AppColors.border,
  );
}
