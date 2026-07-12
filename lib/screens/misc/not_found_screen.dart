import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme.dart';
import '../../widgets/app_button.dart';

class NotFoundScreen extends StatelessWidget {
  const NotFoundScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(color: AppColors.saleLight, borderRadius: BorderRadius.circular(24)),
                child: const Icon(LucideIcons.home, size: 36, color: AppColors.primary),
              ),
              const SizedBox(height: 16),
              const Text('Page introuvable', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.text)),
              const SizedBox(height: 8),
              const Text("Cette page n'existe pas ou a été déplacée.", textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
              const SizedBox(height: 20),
              AppButton(title: "Retour à l'accueil", onPressed: () => context.go('/')),
            ],
          ),
        ),
      ),
    );
  }
}
