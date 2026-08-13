import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/mode_provider.dart';

class _CityImage {
  final String name;
  final String url;
  const _CityImage(this.name, this.url);
}

const _cityImages = [
  _CityImage('Kinshasa', 'https://images.pexels.com/photos/3044473/pexels-photo-3044473.jpeg?auto=compress&cs=tinysrgb&w=600'),
  _CityImage('Lubumbashi', 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600'),
  _CityImage('Goma', 'https://images.pexels.com/photos/1534057/pexels-photo-1534057.jpeg?auto=compress&cs=tinysrgb&w=600'),
  _CityImage('Bukavu', 'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=600'),
  _CityImage('Kolwezi', 'https://images.pexels.com/photos/2422461/pexels-photo-2422461.jpeg?auto=compress&cs=tinysrgb&w=600'),
  _CityImage('Kalemie', 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=600'),
];

class _Stat {
  final String value;
  final String label;
  final IconData icon;
  const _Stat(this.value, this.label, this.icon);
}

const _stats = [
  _Stat('6', 'Villes', LucideIcons.mapPin),
  _Stat('500+', 'Biens', LucideIcons.building2),
  _Stat('1K+', 'Utilisateurs', LucideIcons.users),
  _Stat('100%', 'Sécurisé', LucideIcons.shield),
];

class _Feature {
  final IconData icon;
  final String title;
  final String desc;
  const _Feature(this.icon, this.title, this.desc);
}

const _features = [
  _Feature(LucideIcons.shield, 'Anti-contournement', 'Contacts masqués, chat anonyme, escrow automatique sur chaque deal'),
  _Feature(LucideIcons.eye, 'Biens vérifiés', 'Chaque annonce est validée par notre équipe avant publication'),
  _Feature(LucideIcons.users, 'Accompagnement', 'Un agent présent à chaque visite et signature de contrat'),
  _Feature(LucideIcons.trendingUp, 'Mobile Money', 'Paiements M-Pesa, Airtel Money, Orange Money en CDF'),
];

class _Step {
  final String num;
  final String title;
  final String desc;
  const _Step(this.num, this.title, this.desc);
}

const _steps = [
  _Step('01', 'Recherchez', 'Explorez les biens par ville, type et budget'),
  _Step('02', 'Contactez', 'Manifestez votre intérêt en toute confidentialité'),
  _Step('03', 'Visitez', 'Un agent vous accompagne lors de chaque visite'),
  _Step('04', 'Signez', "Contrat sécurisé avec escrow des commissions"),
];

class ModeSelectionScreen extends ConsumerStatefulWidget {
  const ModeSelectionScreen({super.key});

  @override
  ConsumerState<ModeSelectionScreen> createState() => _ModeSelectionScreenState();
}

class _ModeSelectionScreenState extends ConsumerState<ModeSelectionScreen> {
  bool _redirected = false;

  void _maybeRedirect(AuthState auth) {
    if (_redirected || auth.loading || auth.user == null) return;
    _redirected = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.go('/home');
    });
  }

  void _handleSelect(String mode) {
    ref.read(modeProvider.notifier).selectMode(mode);
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    _maybeRedirect(auth);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildHero(context),
            _buildModeSelection(context),
            _buildFeatures(),
            _buildSteps(),
            _buildCities(),
            _buildPremiumBanner(context),
            _buildAuthSection(context),
            _buildFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildHero(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: AppColors.gradientPrimaryDeep,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                        ),
                        child: const Icon(LucideIcons.home, size: 22, color: AppColors.textInverse),
                      ),
                      const SizedBox(width: 8),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '1 Futur Chez Vous',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textInverse, letterSpacing: 0.3),
                          ),
                          Text(
                            'Votre avenir immobilier en RDC',
                            style: TextStyle(fontSize: 10, color: Colors.white70),
                          ),
                        ],
                      ),
                    ],
                  ),
                  GestureDetector(
                    onTap: () => context.push('/login'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.35), width: 1.5),
                        color: Colors.white.withValues(alpha: 0.08),
                      ),
                      child: const Text('Connexion', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textInverse)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Text(
                'Trouvez votre\nfutur chez vous',
                style: TextStyle(fontSize: 34, fontWeight: FontWeight.w800, color: AppColors.textInverse, height: 1.25),
              ),
              const SizedBox(height: 12),
              const Text(
                'La plateforme immobilière de référence en République Démocratique du Congo. Sécurisée, transparente et 100% locale.',
                style: TextStyle(fontSize: 14, color: Colors.white70, height: 1.55),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: _stats
                      .map((s) => Column(
                            children: [
                              Icon(s.icon, size: 18, color: AppColors.accent),
                              const SizedBox(height: 4),
                              Text(s.value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textInverse)),
                              Text(s.label, style: const TextStyle(fontSize: 11, color: Colors.white60)),
                            ],
                          ))
                      .toList(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModeSelection(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'JE SOUHAITE...',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textTertiary, letterSpacing: 1.5),
          ),
          const SizedBox(height: 14),
          GestureDetector(
            onTap: () => _handleSelect('rent'),
            child: Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                gradient: const LinearGradient(colors: AppColors.gradientAccent, begin: Alignment.topLeft, end: Alignment.bottomRight),
                boxShadow: AppShadows.md,
              ),
              child: Row(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(14)),
                    child: const Icon(LucideIcons.key, size: 28, color: AppColors.textInverse),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Louer un bien', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.textInverse)),
                        SizedBox(height: 3),
                        Text('Appartements, maisons, studios à la location', style: TextStyle(fontSize: 13, color: Colors.white70, height: 1.35)),
                      ],
                    ),
                  ),
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), shape: BoxShape.circle),
                    child: const Icon(LucideIcons.arrowRight, size: 18, color: AppColors.textInverse),
                  ),
                ],
              ),
            ),
          ),
          GestureDetector(
            onTap: () => _handleSelect('sale'),
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                color: AppColors.surface,
                boxShadow: AppShadows.md,
              ),
              child: Row(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(color: AppColors.saleLight, borderRadius: BorderRadius.circular(14)),
                    child: const Icon(LucideIcons.home, size: 28, color: AppColors.primary),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Acheter un bien', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.text)),
                        SizedBox(height: 3),
                        Text('Maisons, villas et terrains à vendre en RDC', style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.35)),
                      ],
                    ),
                  ),
                  Container(
                    width: 34,
                    height: 34,
                    decoration: const BoxDecoration(color: AppColors.saleLight, shape: BoxShape.circle),
                    child: const Icon(LucideIcons.arrowRight, size: 18, color: AppColors.primary),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatures() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Pourquoi 1 Futur Chez Vous ?', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.text)),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: _features
                .map((f) => SizedBox(
                      width: (MediaQuery.of(context).size.width - 20 * 2 - 12) / 2,
                      child: Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(color: AppColors.saleLight, borderRadius: BorderRadius.circular(12)),
                              child: Icon(f.icon, size: 24, color: AppColors.primary),
                            ),
                            const SizedBox(height: 12),
                            Text(f.title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.text)),
                            const SizedBox(height: 4),
                            Text(f.desc, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.45)),
                          ],
                        ),
                      ),
                    ))
                .toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildSteps() {
    return Container(
      color: AppColors.surfaceSecondary,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Comment ça marche', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.text)),
          const SizedBox(height: 18),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: _steps
                .map((s) => SizedBox(
                      width: (MediaQuery.of(context).size.width - 20 * 2 - 12) / 2,
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 36,
                              height: 36,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(10)),
                              child: Text(s.num, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.textInverse)),
                            ),
                            const SizedBox(height: 10),
                            Text(s.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.text)),
                            const SizedBox(height: 4),
                            Text(s.desc, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4)),
                          ],
                        ),
                      ),
                    ))
                .toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildCities() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Text('Nos villes', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.text)),
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 100,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: _cityImages.length,
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (context, i) {
                final city = _cityImages[i];
                return GestureDetector(
                  onTap: () => _handleSelect('rent'),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: SizedBox(
                      width: 140,
                      height: 100,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          Image.network(city.url, fit: BoxFit.cover),
                          DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [Colors.transparent, Colors.black.withValues(alpha: 0.7)],
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: 10,
                            left: 12,
                            child: Text(city.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textInverse)),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumBanner(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: AppColors.gradientPrimary, begin: Alignment.topLeft, end: Alignment.bottomRight),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          children: [
            const Icon(LucideIcons.crown, size: 28, color: AppColors.accent),
            const SizedBox(height: 8),
            const Text('Passez en Premium', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textInverse)),
            const SizedBox(height: 8),
            const Text(
              "Recherches illimitées, alertes push, visites prioritaires, sans publicités.\n7 jours d'essai gratuit.",
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Colors.white70, height: 1.5),
            ),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: () => context.push('/register'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
                decoration: BoxDecoration(color: AppColors.accent, borderRadius: BorderRadius.circular(12)),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Commencer gratuitement', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textInverse)),
                    SizedBox(width: 8),
                    Icon(LucideIcons.arrowRight, size: 16, color: AppColors.textInverse),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAuthSection(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      child: Column(
        children: [
          const Text('Vous avez un bien à proposer ?', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: () => context.push('/register'),
            child: const Text(
              'Créer un compte propriétaire',
              style: TextStyle(fontSize: 14, color: AppColors.accent, fontWeight: FontWeight.w600, decoration: TextDecoration.underline),
            ),
          ),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: () => context.push('/login'),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 32),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border, width: 1.5),
                color: AppColors.surface,
              ),
              child: const Text('Se connecter', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.text)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return const Padding(
      padding: EdgeInsets.only(bottom: 40, top: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.home, size: 16, color: AppColors.textTertiary),
          SizedBox(width: 6),
          Text('1 Futur Chez Vous - 2026 - RDC', style: TextStyle(fontSize: 12, color: AppColors.textTertiary)),
        ],
      ),
    );
  }
}
