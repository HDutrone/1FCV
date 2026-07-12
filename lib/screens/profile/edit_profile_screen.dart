import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/supabase_client.dart';
import '../../core/theme.dart';
import '../../data/locations_repository.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_input.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late final TextEditingController _nameController;
  late final TextEditingController _bioController;
  String _cityId = '';
  String _communeId = '';
  List<City> _cities = [];
  List<Commune> _communes = [];
  bool _saving = false;
  bool _saved = false;

  @override
  void initState() {
    super.initState();
    final profile = ref.read(authProvider).profile;
    _nameController = TextEditingController(text: profile?.displayName ?? '');
    _bioController = TextEditingController(text: profile?.bio ?? '');
    _cityId = profile?.cityId ?? '';
    _communeId = profile?.communeId ?? '';
    _loadCities();
    if (_cityId.isNotEmpty) _loadCommunes(_cityId);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _loadCities() async {
    try {
      final cities = await locationsRepository.fetchCities();
      if (mounted) setState(() => _cities = cities);
    } catch (_) {}
  }

  Future<void> _loadCommunes(String cityId) async {
    try {
      final communes = await locationsRepository.fetchCommunes(cityId);
      if (mounted) setState(() => _communes = communes);
    } catch (_) {}
  }

  Future<void> _handleSave() async {
    final user = ref.read(authProvider).user;
    if (user == null) return;
    setState(() => _saving = true);
    try {
      await supabase.from('profiles').update({
        'display_name': _nameController.text.trim(),
        'bio': _bioController.text.trim(),
        'city_id': _cityId.isEmpty ? null : _cityId,
        'commune_id': _communeId.isEmpty ? null : _communeId,
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', user.id);
      await ref.read(authProvider.notifier).refreshProfile();
      if (!mounted) return;
      setState(() {
        _saving = false;
        _saved = true;
      });
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) setState(() => _saved = false);
      });
    } catch (_) {
      if (mounted) setState(() => _saving = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Une erreur est survenue.')),
        );
      }
    }
  }

  Future<void> _showCityPicker() async {
    final selected = await _showPicker(
      title: 'Choisir une ville',
      items: _cities.map((c) => (id: c.id, name: c.name)).toList(),
      selectedId: _cityId,
    );
    if (selected != null) {
      setState(() {
        _cityId = selected;
        _communeId = '';
        _communes = [];
      });
      if (selected.isNotEmpty) _loadCommunes(selected);
    }
  }

  Future<void> _showCommunePicker() async {
    final selected = await _showPicker(
      title: 'Choisir une commune',
      items: _communes.map((c) => (id: c.id, name: c.name)).toList(),
      selectedId: _communeId,
    );
    if (selected != null) setState(() => _communeId = selected);
  }

  Future<String?> _showPicker({
    required String title,
    required List<({String id, String name})> items,
    required String selectedId,
  }) {
    return showModalBottomSheet<String>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.text)),
                    GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: const Icon(LucideIcons.x, size: 20, color: AppColors.text),
                    ),
                  ],
                ),
              ),
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: items.length,
                  itemBuilder: (context, i) {
                    final item = items[i];
                    final isSelected = item.id == selectedId;
                    return ListTile(
                      title: Text(
                        item.name,
                        style: TextStyle(
                          fontSize: 15,
                          color: isSelected ? AppColors.primary : AppColors.text,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                        ),
                      ),
                      tileColor: isSelected ? AppColors.primaryLight.withValues(alpha: 0.08) : null,
                      onTap: () => Navigator.of(context).pop(item.id),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(authProvider).profile;
    final selectedCity = _cities.where((c) => c.id == _cityId).toList();
    final selectedCommune = _communes.where((c) => c.id == _communeId).toList();

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
                    child: Text('Modifier le profil', textAlign: TextAlign.center, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.text)),
                  ),
                  const SizedBox(width: 40),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    AppInput(
                      label: "Nom d'affichage",
                      placeholder: 'Votre nom',
                      controller: _nameController,
                    ),
                    AppInput(
                      label: 'Bio',
                      placeholder: 'Quelques mots sur vous...',
                      controller: _bioController,
                      multiline: true,
                      maxLines: 3,
                    ),
                    const Text(
                      'VILLE',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textSecondary, letterSpacing: 0.5),
                    ),
                    const SizedBox(height: 6),
                    GestureDetector(
                      onTap: _showCityPicker,
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.border, width: 1.5),
                          borderRadius: BorderRadius.circular(12),
                          color: AppColors.surface,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              selectedCity.isNotEmpty ? selectedCity.first.name : 'Choisir une ville...',
                              style: TextStyle(fontSize: 15, color: selectedCity.isNotEmpty ? AppColors.text : AppColors.textTertiary),
                            ),
                            const Icon(LucideIcons.chevronDown, size: 16, color: AppColors.textSecondary),
                          ],
                        ),
                      ),
                    ),
                    if (_cityId.isNotEmpty) ...[
                      const Text(
                        'COMMUNE',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textSecondary, letterSpacing: 0.5),
                      ),
                      const SizedBox(height: 6),
                      GestureDetector(
                        onTap: _showCommunePicker,
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            border: Border.all(color: AppColors.border, width: 1.5),
                            borderRadius: BorderRadius.circular(12),
                            color: AppColors.surface,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                selectedCommune.isNotEmpty ? selectedCommune.first.name : 'Choisir une commune...',
                                style: TextStyle(fontSize: 15, color: selectedCommune.isNotEmpty ? AppColors.text : AppColors.textTertiary),
                              ),
                              const Icon(LucideIcons.chevronDown, size: 16, color: AppColors.textSecondary),
                            ],
                          ),
                        ),
                      ),
                    ],
                    Container(
                      padding: const EdgeInsets.all(14),
                      margin: const EdgeInsets.only(bottom: 24),
                      decoration: BoxDecoration(color: AppColors.saleLight, borderRadius: BorderRadius.circular(12)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Identité anonyme', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.primary)),
                          const SizedBox(height: 4),
                          Text(
                            'Votre identité est protégée par un ID anonyme : ${profile?.anonymousId ?? ''}',
                            style: const TextStyle(fontSize: 12, color: AppColors.primary, height: 1.4),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Cet identifiant est utilisé dans toutes les communications via la plateforme.',
                            style: TextStyle(fontSize: 12, color: AppColors.primary, height: 1.4),
                          ),
                        ],
                      ),
                    ),
                    AppButton(
                      title: _saved ? 'Enregistré !' : 'Enregistrer les modifications',
                      onPressed: _saving ? null : _handleSave,
                      loading: _saving,
                      variant: _saved ? AppButtonVariant.secondary : AppButtonVariant.primary,
                      size: AppButtonSize.lg,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
