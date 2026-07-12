import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/theme.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_input.dart';

const _searcherRoles = ['tenant', 'buyer', 'investor'];
const _publisherRoles = ['owner', 'seller', 'agent', 'promoter'];

const _roleIcons = {
  'tenant': LucideIcons.user,
  'buyer': LucideIcons.user,
  'owner': LucideIcons.building2,
  'seller': LucideIcons.trendingUp,
  'agent': LucideIcons.briefcase,
  'promoter': LucideIcons.building2,
  'investor': LucideIcons.trendingUp,
  'admin': LucideIcons.user,
};

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  String _role = 'tenant';
  bool _loading = false;
  bool _success = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final confirm = _confirmController.text;

    if (name.isEmpty || email.isEmpty || password.isEmpty || confirm.isEmpty) {
      setState(() => _error = 'Veuillez remplir tous les champs.');
      return;
    }
    if (password != confirm) {
      setState(() => _error = 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setState(() => _error = 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });
    final error = await ref.read(authProvider.notifier).signUp(email, password, name, _role);
    if (!mounted) return;
    setState(() => _loading = false);
    if (error != null) {
      setState(() => _error = error.contains('already registered') ? 'Cet email est déjà utilisé.' : error);
    } else {
      setState(() => _success = true);
      Future.delayed(const Duration(milliseconds: 1500), () {
        if (mounted) context.go('/home');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_success) {
      final cfg = roleConfigs[_role]!;
      return Scaffold(
        body: Container(
          width: double.infinity,
          height: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(colors: AppColors.gradientPrimary, begin: Alignment.topLeft, end: Alignment.bottomRight),
          ),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 72,
                  height: 72,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                  ),
                  child: const Icon(LucideIcons.home, size: 36, color: AppColors.textInverse),
                ),
                const SizedBox(height: 12),
                const Text('Bienvenue !', style: TextStyle(fontSize: 30, fontWeight: FontWeight.w800, color: AppColors.textInverse)),
                const SizedBox(height: 4),
                Text(cfg.labelFr, style: const TextStyle(fontSize: 14, color: Colors.white70, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                const Text('Votre compte a été créé avec succès.', style: TextStyle(fontSize: 16, color: Colors.white70)),
              ],
            ),
          ),
        ),
      );
    }

    final selectedCfg = roleConfigs[_role]!;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: Column(
        children: [
          Container(
            width: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(colors: AppColors.gradientPrimary, begin: Alignment.topLeft, end: Alignment.bottomRight),
            ),
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: Container(
                        width: 40,
                        height: 40,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(LucideIcons.arrowLeft, size: 22, color: AppColors.textInverse),
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text('Créer un compte', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.textInverse)),
                    const SizedBox(height: 4),
                    const Text('Rejoignez 1 Futur Chez Vous', style: TextStyle(fontSize: 14, color: Colors.white70)),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'JE SUIS...',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(child: _buildRoleCategory('Chercheur', _searcherRoles)),
                      Container(width: 1, height: 160, margin: const EdgeInsets.symmetric(horizontal: 8), color: AppColors.border),
                      Expanded(child: _buildRoleCategory('Professionnel', _publisherRoles)),
                    ],
                  ),
                  if (selectedCfg.isPro)
                    Container(
                      margin: const EdgeInsets.only(top: 16),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: selectedCfg.color.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: selectedCfg.color.withValues(alpha: 0.4)),
                      ),
                      child: Row(
                        children: [
                          Icon(LucideIcons.briefcase, size: 14, color: selectedCfg.color),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              "Profil professionnel — vérification KYC requise après l'inscription",
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: selectedCfg.color, height: 1.35),
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 16),
                  if (_error != null)
                    Container(
                      padding: const EdgeInsets.all(14),
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(color: AppColors.errorLight, borderRadius: BorderRadius.circular(10)),
                      child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 14, fontWeight: FontWeight.w500)),
                    ),
                  AppInput(
                    label: 'Nom complet',
                    placeholder: 'Votre nom',
                    controller: _nameController,
                    leftIcon: const Icon(LucideIcons.user, size: 18, color: AppColors.textSecondary),
                  ),
                  AppInput(
                    label: 'Adresse email',
                    placeholder: 'votre@email.com',
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    leftIcon: const Icon(LucideIcons.mail, size: 18, color: AppColors.textSecondary),
                  ),
                  AppInput(
                    label: 'Mot de passe',
                    placeholder: 'Minimum 6 caractères',
                    controller: _passwordController,
                    isPassword: true,
                    leftIcon: const Icon(LucideIcons.lock, size: 18, color: AppColors.textSecondary),
                  ),
                  AppInput(
                    label: 'Confirmer le mot de passe',
                    placeholder: 'Répétez votre mot de passe',
                    controller: _confirmController,
                    isPassword: true,
                    leftIcon: const Icon(LucideIcons.lock, size: 18, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 8),
                  AppButton(
                    title: 'Créer mon compte',
                    onPressed: _loading ? null : _handleRegister,
                    loading: _loading,
                    size: AppButtonSize.lg,
                  ),
                  const SizedBox(height: 20),
                  Center(
                    child: GestureDetector(
                      onTap: () => context.go('/login'),
                      child: RichText(
                        text: const TextSpan(
                          style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                          children: [
                            TextSpan(text: 'Déjà un compte ? '),
                            TextSpan(text: 'Se connecter', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoleCategory(String title, List<String> roles) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title.toUpperCase(),
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textTertiary, letterSpacing: 0.8),
        ),
        const SizedBox(height: 6),
        ...roles.map((r) {
          final cfg = roleConfigs[r]!;
          final icon = _roleIcons[r] ?? LucideIcons.user;
          final isActive = _role == r;
          return Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: GestureDetector(
              onTap: () => setState(() => _role = r),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isActive ? cfg.color.withValues(alpha: 0.07) : AppColors.surfaceSecondary,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: isActive ? cfg.color : AppColors.border, width: 1.5),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 30,
                      height: 30,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: isActive ? cfg.color : AppColors.surfaceSecondary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(icon, size: 16, color: isActive ? AppColors.textInverse : AppColors.textSecondary),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            cfg.labelFr,
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: isActive ? cfg.color : AppColors.text),
                          ),
                          Text(
                            cfg.description,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 10, color: AppColors.textTertiary),
                          ),
                        ],
                      ),
                    ),
                    if (isActive)
                      Container(width: 8, height: 8, decoration: BoxDecoration(color: cfg.color, shape: BoxShape.circle)),
                  ],
                ),
              ),
            ),
          );
        }),
      ],
    );
  }
}
