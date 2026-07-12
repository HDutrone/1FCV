import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/supabase_client.dart';
import '../../core/theme.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../providers/subscription_provider.dart';

class _PaymentMethod {
  final String id;
  final String name;
  final Color color;
  const _PaymentMethod(this.id, this.name, this.color);
}

const _paymentMethods = [
  _PaymentMethod('mpesa', 'M-Pesa (Vodacom)', Color(0xFFE60000)),
  _PaymentMethod('airtel', 'Airtel Money', Color(0xFFED1C24)),
  _PaymentMethod('orange', 'Orange Money', Color(0xFFFF6600)),
];

class _FeatureRow {
  final IconData icon;
  final String free;
  final String premium;
  const _FeatureRow(this.icon, this.free, this.premium);
}

const _featuresByRole = <String, List<_FeatureRow>>{
  'tenant': [
    _FeatureRow(LucideIcons.eye, '5 recherches/jour', 'Recherches illimitées'),
    _FeatureRow(LucideIcons.bell, "Pas d'alertes", 'Alertes push personnalisées'),
    _FeatureRow(LucideIcons.star, '3 intérêts/semaine', 'Intérêts illimités'),
    _FeatureRow(LucideIcons.zap, 'Publicités', 'Sans publicités'),
    _FeatureRow(LucideIcons.shield, 'Visites standard', 'Visites prioritaires'),
  ],
  'buyer': [
    _FeatureRow(LucideIcons.eye, '5 recherches/jour', 'Recherches illimitées'),
    _FeatureRow(LucideIcons.bell, "Pas d'alertes", 'Alertes push achat'),
    _FeatureRow(LucideIcons.trendingUp, 'Pas de simulation', 'Simulation prêt bancaire'),
    _FeatureRow(LucideIcons.zap, 'Publicités', 'Sans publicités'),
    _FeatureRow(LucideIcons.shield, 'Visites standard', 'Visites prioritaires'),
  ],
  'owner': [
    _FeatureRow(LucideIcons.building2, '1 annonce', 'Annonces illimitées'),
    _FeatureRow(LucideIcons.zap, 'Pas de boost', 'Boost de visibilité'),
    _FeatureRow(LucideIcons.barChart2, 'Stats basiques', 'Stats détaillées des leads'),
  ],
  'seller': [
    _FeatureRow(LucideIcons.building2, '1 annonce vente', 'Ventes illimitées'),
    _FeatureRow(LucideIcons.zap, 'Pas de boost', 'Boost de visibilité'),
    _FeatureRow(LucideIcons.barChart2, 'Stats basiques', 'Gestion offres concurrentes'),
  ],
  'agent': [
    _FeatureRow(LucideIcons.building2, '3 biens gérés', 'Biens illimités'),
    _FeatureRow(LucideIcons.trendingUp, 'Split 50/50', 'Split optimisé + KPI'),
    _FeatureRow(LucideIcons.barChart2, 'Pas de stats', 'Tableau de bord commissions'),
    _FeatureRow(LucideIcons.bell, 'Alertes basiques', 'Alertes temps réel'),
  ],
  'promoter': [
    _FeatureRow(LucideIcons.building2, '1 projet', 'Projets illimités'),
    _FeatureRow(LucideIcons.zap, 'Pas de boost', 'Boost promotions'),
    _FeatureRow(LucideIcons.barChart2, 'Stats basiques', 'CA promos + analytics'),
    _FeatureRow(LucideIcons.bell, 'Alertes basiques', 'Alertes investisseurs'),
  ],
  'investor': [
    _FeatureRow(LucideIcons.trendingUp, '10 recherches/jour', 'Recherches illimitées'),
    _FeatureRow(LucideIcons.barChart2, "Pas d'analytics", 'Portefeuille + IRR'),
    _FeatureRow(LucideIcons.building2, 'Simulation basique', 'Simulations prêt avancées'),
    _FeatureRow(LucideIcons.bell, 'Alertes basiques', "Alertes opportunités"),
  ],
  'admin': [
    _FeatureRow(LucideIcons.shield, 'Accès complet', 'Accès complet'),
  ],
};

const _heroCopyByRole = {
  'tenant': 'Trouvez votre bien plus vite',
  'buyer': 'Achetez au meilleur prix',
  'owner': 'Maximisez vos leads locatifs',
  'seller': 'Vendez plus rapidement',
  'agent': 'Gérez plus de biens, gagnez plus',
  'promoter': 'Accélérez vos projets',
  'investor': 'Optimisez votre portefeuille',
  'admin': 'Accès complet',
};

class SubscriptionScreen extends ConsumerStatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  ConsumerState<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends ConsumerState<SubscriptionScreen> {
  bool _success = false;

  Future<void> _openPaymentModal(SubscriptionPlan premiumPlan) async {
    String? selectedPayment;
    bool processing = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Choisir le paiement', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.text)),
                          GestureDetector(
                            onTap: () => Navigator.of(context).pop(),
                            child: const Icon(LucideIcons.x, size: 22, color: AppColors.text),
                          ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            '${_formatCdf(premiumPlan.priceCdf)} CDF/mois',
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.primary),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Essai gratuit 7 jours inclus',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 13, color: AppColors.success, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 20),
                          ..._paymentMethods.map((pm) {
                            final isActive = selectedPayment == pm.id;
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: GestureDetector(
                                onTap: () => setModalState(() => selectedPayment = pm.id),
                                child: Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: isActive ? AppColors.primary : AppColors.border, width: 1.5),
                                    color: isActive ? AppColors.primaryLight.withValues(alpha: 0.1) : null,
                                  ),
                                  child: Row(
                                    children: [
                                      Container(width: 14, height: 14, decoration: BoxDecoration(color: pm.color, shape: BoxShape.circle)),
                                      const SizedBox(width: 12),
                                      Expanded(child: Text(pm.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.text))),
                                      if (isActive) const Icon(LucideIcons.check, size: 18, color: AppColors.primary),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          }),
                          const SizedBox(height: 8),
                          GestureDetector(
                            onTap: selectedPayment == null || processing
                                ? null
                                : () async {
                                    setModalState(() => processing = true);
                                    await _handleSubscribe(premiumPlan, selectedPayment!);
                                    if (context.mounted) Navigator.of(context).pop();
                                  },
                            child: Opacity(
                              opacity: selectedPayment == null || processing ? 0.5 : 1,
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                alignment: Alignment.center,
                                decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(14)),
                                child: processing
                                    ? const SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.textInverse),
                                      )
                                    : const Text("Commencer l'essai gratuit", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textInverse)),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            "En souscrivant, vous acceptez les conditions d'utilisation. Vous serez débité après la période d'essai de 7 jours.",
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 11, color: AppColors.textTertiary, height: 1.4),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _handleSubscribe(SubscriptionPlan plan, String paymentMethod) async {
    final user = ref.read(authProvider).user;
    if (user == null) return;
    final now = DateTime.now();
    final ref_ = '${paymentMethod.toUpperCase()}-${now.millisecondsSinceEpoch}-${(1000 + now.microsecond) % 999999}';
    try {
      await supabase.from('user_subscriptions').insert({
        'user_id': user.id,
        'plan_id': plan.id,
        'status': 'trial',
        'payment_method': paymentMethod,
        'payment_reference': ref_,
        'trial_ends_at': now.add(const Duration(days: 7)).toIso8601String(),
        'expires_at': now.add(const Duration(days: 37)).toIso8601String(),
      });
      await ref.read(subscriptionProvider.notifier).refresh();
      if (mounted) setState(() => _success = true);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Une erreur est survenue lors de la souscription.')),
        );
      }
    }
  }

  String _formatCdf(double value) {
    final s = value.toInt().toString();
    final buffer = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buffer.write(' ');
      buffer.write(s[i]);
    }
    return buffer.toString();
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(authProvider).profile;
    final subscription = ref.watch(subscriptionProvider);
    final role = profile?.role ?? 'tenant';
    final roleCfg = roleConfigs[role]!;
    final rolePlans = subscription.plans.where((p) => p.targetRole == role).toList();
    final freePlan = rolePlans.where((p) => p.priceCdf == 0).toList();
    final premiumPlan = rolePlans.where((p) => p.priceCdf > 0).toList();
    final features = _featuresByRole[role] ?? _featuresByRole['tenant']!;
    final isPremium = subscription.isPremium;

    if (_success) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 88,
                    height: 88,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: AppColors.accentLight.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(44)),
                    child: const Icon(LucideIcons.crown, size: 40, color: AppColors.accent),
                  ),
                  const SizedBox(height: 12),
                  const Text('Bienvenue en Premium !', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.text)),
                  const SizedBox(height: 12),
                  const Text(
                    "Votre essai gratuit de 7 jours est activé. Profitez de toutes les fonctionnalités premium.",
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 15, color: AppColors.textSecondary, height: 1.5),
                  ),
                  const SizedBox(height: 16),
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 40),
                      decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(12)),
                      child: const Text('Continuer', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textInverse)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(bottom: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: Container(
                      width: 40,
                      height: 40,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(color: AppColors.surfaceSecondary, borderRadius: BorderRadius.circular(12)),
                      child: const Icon(LucideIcons.arrowLeft, size: 20, color: AppColors.text),
                    ),
                  ),
                  const Expanded(
                    child: Text('Abonnements', textAlign: TextAlign.center, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.text)),
                  ),
                  const SizedBox(width: 40),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.only(bottom: 40),
                children: [
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(colors: AppColors.gradientPrimary, begin: Alignment.topLeft, end: Alignment.bottomRight),
                    ),
                    child: Column(
                      children: [
                        const Icon(LucideIcons.crown, size: 32, color: AppColors.accent),
                        const SizedBox(height: 8),
                        Text(
                          _heroCopyByRole[role] ?? _heroCopyByRole['tenant']!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textInverse),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 12),
                          decoration: BoxDecoration(
                            color: roleCfg.color.withValues(alpha: 0.3),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: roleCfg.color.withValues(alpha: 0.6)),
                          ),
                          child: Text(roleCfg.labelFr, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textInverse)),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Passez en Premium pour débloquer toutes les fonctionnalités',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 13, color: Colors.white70, height: 1.5),
                        ),
                        if (isPremium)
                          Container(
                            margin: const EdgeInsets.only(top: 4),
                            padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 14),
                            decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(20)),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(LucideIcons.check, size: 14, color: AppColors.success),
                                SizedBox(width: 6),
                                Text('Abonnement actif', style: TextStyle(fontSize: 13, color: AppColors.success, fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Comparaison des plans', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.text)),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            const SizedBox(width: 36),
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                margin: const EdgeInsets.symmetric(horizontal: 3),
                                alignment: Alignment.center,
                                decoration: BoxDecoration(color: AppColors.surfaceSecondary, borderRadius: BorderRadius.circular(8)),
                                child: const Text('Gratuit', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                              ),
                            ),
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                margin: const EdgeInsets.symmetric(horizontal: 3),
                                alignment: Alignment.center,
                                decoration: BoxDecoration(color: AppColors.accentLight.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8)),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(LucideIcons.crown, size: 14, color: AppColors.accent),
                                    SizedBox(width: 4),
                                    Text('Premium', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.accent)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        ...features.map((f) => Container(
                              decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.borderLight))),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              child: Row(
                                children: [
                                  SizedBox(width: 36, child: Icon(f.icon, size: 16, color: AppColors.textSecondary)),
                                  Expanded(
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 6),
                                      child: Text(f.free, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                    ),
                                  ),
                                  Expanded(
                                    child: Container(
                                      color: AppColors.accentLight.withValues(alpha: 0.08),
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      child: Text(f.premium, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600)),
                                    ),
                                  ),
                                ],
                              ),
                            )),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(18),
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.border, width: 1.5),
                              boxShadow: AppShadows.sm,
                            ),
                            child: Column(
                              children: [
                                const Text('Gratuit', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.text)),
                                const SizedBox(height: 6),
                                const Text('0 CDF', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.text)),
                                const Text('/mois', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                const Divider(height: 24, color: AppColors.borderLight),
                                Text(
                                  freePlan.isNotEmpty ? (freePlan.first.features['description']?.toString() ?? 'Fonctionnalités de base') : 'Fonctionnalités de base',
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, height: 1.4),
                                ),
                                if (!isPremium)
                                  Container(
                                    margin: const EdgeInsets.only(top: 12),
                                    padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
                                    decoration: BoxDecoration(color: AppColors.surfaceSecondary, borderRadius: BorderRadius.circular(8)),
                                    child: const Text('Plan actuel', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                                  ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.fromLTRB(18, 32, 18, 18),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.accent, width: 1.5),
                              boxShadow: AppShadows.sm,
                            ),
                            child: Stack(
                              clipBehavior: Clip.none,
                              alignment: Alignment.topCenter,
                              children: [
                                Positioned(
                                  top: -32 + 12,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 12),
                                    decoration: BoxDecoration(
                                      gradient: const LinearGradient(colors: AppColors.gradientAccent, begin: Alignment.topLeft, end: Alignment.bottomRight),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(LucideIcons.crown, size: 12, color: AppColors.textInverse),
                                        SizedBox(width: 4),
                                        Text('Recommandé', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textInverse)),
                                      ],
                                    ),
                                  ),
                                ),
                                Column(
                                  children: [
                                    const Text('Premium', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.text)),
                                    const SizedBox(height: 6),
                                    Text(
                                      '${_formatCdf(premiumPlan.isNotEmpty ? premiumPlan.first.priceCdf : 0)} CDF',
                                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.accent),
                                    ),
                                    const Text('/mois', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                    Text(
                                      '~ \$${premiumPlan.isNotEmpty ? premiumPlan.first.priceUsd : 0} USD',
                                      style: const TextStyle(fontSize: 11, color: AppColors.textTertiary),
                                    ),
                                    const Divider(height: 24, color: AppColors.borderLight),
                                    Text(
                                      premiumPlan.isNotEmpty ? (premiumPlan.first.features['description']?.toString() ?? 'Toutes les fonctionnalités') : 'Toutes les fonctionnalités',
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, height: 1.4),
                                    ),
                                    const SizedBox(height: 6),
                                    const Text("7 jours d'essai gratuit", style: TextStyle(fontSize: 11, color: AppColors.success, fontWeight: FontWeight.w600)),
                                    if (isPremium)
                                      Container(
                                        margin: const EdgeInsets.only(top: 12),
                                        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
                                        decoration: BoxDecoration(color: AppColors.surfaceSecondary, borderRadius: BorderRadius.circular(8)),
                                        child: const Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(LucideIcons.check, size: 14, color: AppColors.success),
                                            SizedBox(width: 4),
                                            Text('Actif', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.success)),
                                          ],
                                        ),
                                      )
                                    else
                                      GestureDetector(
                                        onTap: premiumPlan.isEmpty ? null : () => _openPaymentModal(premiumPlan.first),
                                        child: Container(
                                          margin: const EdgeInsets.only(top: 12),
                                          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                                          decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(10)),
                                          child: const Text('Essayer gratuitement', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textInverse)),
                                        ),
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
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Modes de paiement acceptés', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.text)),
                        const SizedBox(height: 12),
                        ..._paymentMethods.map((pm) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                children: [
                                  Container(width: 10, height: 10, decoration: BoxDecoration(color: pm.color, shape: BoxShape.circle)),
                                  const SizedBox(width: 10),
                                  Text(pm.name, style: const TextStyle(fontSize: 14, color: AppColors.text, fontWeight: FontWeight.w500)),
                                ],
                              ),
                            )),
                        const SizedBox(height: 8),
                        const Text(
                          'Les paiements sont traités en Francs Congolais (CDF) via Mobile Money. Commission de 10% prélevée automatiquement sur chaque transaction immobilière.',
                          style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.5),
                        ),
                      ],
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
