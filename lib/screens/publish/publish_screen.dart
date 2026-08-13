import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show FileOptions;

import '../../core/supabase_client.dart';
import '../../core/theme.dart';
import '../../core/watermark.dart';
import '../../data/locations_repository.dart';
import '../../data/properties_repository.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../providers/subscription_provider.dart';
import '../../widgets/animated_scale_tap.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_input.dart';

const _totalSteps = 4;
const _stepLabels = ['Infos', 'Détails', 'Photos', 'Critères'];
const _maxPhotos = 8;

const _propertyTypes = [
  ('house', 'Maison'),
  ('apartment', 'Appartement'),
  ('villa', 'Villa'),
  ('studio', 'Studio'),
  ('commercial', 'Commercial'),
  ('land', 'Terrain'),
];

const _keywordOptions = [
  'Neuf', 'Rénové', 'Meublé', 'Climatisé', 'Eau courante', 'Électricité',
  'Internet', 'Sécurisé', 'Vue dégagée', 'Près école', 'Proche marché', 'Calme',
];

typedef _PickerOption = ({String id, String label});

class PublishScreen extends ConsumerStatefulWidget {
  const PublishScreen({super.key});

  @override
  ConsumerState<PublishScreen> createState() => _PublishScreenState();
}

class _PublishScreenState extends ConsumerState<PublishScreen> {
  int _step = 1;
  bool _submitting = false;
  bool _success = false;
  bool _limitReached = false;

  List<City> _cities = [];
  List<Commune> _communes = [];

  String _listingType = 'rent';
  String _propertyType = 'house';
  String? _cityId;
  String? _communeId;
  final Set<String> _keywords = {};

  bool _isFurnished = false;
  bool _hasGarage = false;
  bool _hasPool = false;
  bool _hasGarden = false;
  bool _hasSecurity = false;

  bool _petsAllowed = false;
  bool _smokingAllowed = false;
  bool _requiresGuarantor = false;

  final List<XFile> _images = [];

  final _titleController = TextEditingController();
  final _priceController = TextEditingController();
  final _addressController = TextEditingController();
  final _bedroomsController = TextEditingController(text: '3');
  final _bathroomsController = TextEditingController(text: '1');
  final _surfaceController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _minIncomeController = TextEditingController();
  final _maxOccupantsController = TextEditingController(text: '4');
  final _advanceMonthsController = TextEditingController(text: '1');
  final _minStayController = TextEditingController(text: '1');
  final _additionalController = TextEditingController();

  String? _lastCheckedProfileId;

  @override
  void initState() {
    super.initState();
    _loadCities();
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkPublishLimit());
  }

  @override
  void dispose() {
    _titleController.dispose();
    _priceController.dispose();
    _addressController.dispose();
    _bedroomsController.dispose();
    _bathroomsController.dispose();
    _surfaceController.dispose();
    _descriptionController.dispose();
    _minIncomeController.dispose();
    _maxOccupantsController.dispose();
    _advanceMonthsController.dispose();
    _minStayController.dispose();
    _additionalController.dispose();
    super.dispose();
  }

  Future<void> _loadCities() async {
    final cities = await locationsRepository.fetchCities();
    if (mounted) setState(() => _cities = cities);
  }

  Future<void> _loadCommunes(String cityId) async {
    final communes = await locationsRepository.fetchCommunes(cityId);
    if (mounted) setState(() => _communes = communes);
  }

  Future<void> _checkPublishLimit() async {
    final auth = ref.read(authProvider);
    _lastCheckedProfileId = auth.profile?.id;
    if (auth.user == null || auth.profile?.role != 'owner') return;
    final can = await ref.read(subscriptionProvider.notifier).canPublishListing();
    if (mounted) setState(() => _limitReached = !can);
  }

  Future<void> _pickImages() async {
    if (_images.length >= _maxPhotos) return;
    final remaining = _maxPhotos - _images.length;
    final picker = ImagePicker();
    final picked = await picker.pickMultiImage(limit: remaining, imageQuality: 85);
    if (picked.isEmpty) return;
    setState(() {
      _images.addAll(picked.take(remaining));
    });
  }

  void _removeImage(int index) {
    setState(() => _images.removeAt(index));
  }

  void _toggleKeyword(String kw) {
    setState(() {
      if (_keywords.contains(kw)) {
        _keywords.remove(kw);
      } else {
        _keywords.add(kw);
      }
    });
  }

  Future<void> _openCityPicker() async {
    final selected = await _showListPicker(
      title: 'Choisir une ville',
      items: _cities.map((c) => (id: c.id, label: c.name)).toList(),
      selectedId: _cityId,
    );
    if (selected == null) return;
    setState(() {
      _cityId = selected;
      _communeId = null;
      _communes = [];
    });
    _loadCommunes(selected);
  }

  Future<void> _openCommunePicker() async {
    final selected = await _showListPicker(
      title: 'Choisir une commune',
      items: _communes.map((c) => (id: c.id, label: c.name)).toList(),
      selectedId: _communeId,
    );
    if (selected == null) return;
    setState(() => _communeId = selected);
  }

  Future<String?> _showListPicker({
    required String title,
    required List<_PickerOption> items,
    required String? selectedId,
  }) {
    return showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _PickerSheet(title: title, items: items, selectedId: selectedId),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message), backgroundColor: AppColors.error));
  }

  Future<void> _submit() async {
    final auth = ref.read(authProvider);
    final userId = auth.user?.id;
    if (userId == null) return;

    if (_titleController.text.trim().isEmpty) {
      setState(() => _step = 1);
      _showError('Veuillez renseigner le titre de votre annonce.');
      return;
    }

    setState(() => _submitting = true);
    try {
      final payload = {
        'owner_id': userId,
        'listing_type': _listingType,
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'price': double.tryParse(_priceController.text.trim()) ?? 0,
        'property_type': _propertyType,
        'bedrooms': int.tryParse(_bedroomsController.text.trim()) ?? 0,
        'bathrooms': int.tryParse(_bathroomsController.text.trim()) ?? 0,
        'surface_area': double.tryParse(_surfaceController.text.trim()) ?? 0,
        'city_id': _cityId,
        'commune_id': _communeId,
        'address_hint': _addressController.text.trim(),
        'is_furnished': _isFurnished,
        'has_garage': _hasGarage,
        'has_pool': _hasPool,
        'has_garden': _hasGarden,
        'has_security': _hasSecurity,
        'keywords': _keywords.toList(),
        'status': 'pending',
      };

      final property = await propertiesRepository.createProperty(payload);
      final propertyId = property['id'] as String;

      await supabase.from('owner_criteria').insert({
        'property_id': propertyId,
        'min_monthly_income': double.tryParse(_minIncomeController.text.trim()),
        'max_occupants': int.tryParse(_maxOccupantsController.text.trim()) ?? 10,
        'pets_allowed': _petsAllowed,
        'smoking_allowed': _smokingAllowed,
        'requires_guarantor': _requiresGuarantor,
        'advance_months': int.tryParse(_advanceMonthsController.text.trim()) ?? 1,
        'min_stay_months': int.tryParse(_minStayController.text.trim()) ?? 1,
        'additional_requirements': _additionalController.text.trim(),
      });

      await _uploadImages(userId, propertyId);

      if (mounted) setState(() => _success = true);
    } catch (_) {
      _showError("Une erreur est survenue lors de la publication. Veuillez réessayer.");
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _uploadImages(String userId, String propertyId) async {
    for (var i = 0; i < _images.length; i++) {
      final originalBytes = await File(_images[i].path).readAsBytes();
      final watermarked = await watermarkImageBytesAsync(originalBytes);
      final path = '$userId/$propertyId/${DateTime.now().millisecondsSinceEpoch}_$i.jpg';
      await supabase.storage.from('property-images').uploadBinary(
            path,
            watermarked,
            fileOptions: const FileOptions(contentType: 'image/jpeg'),
          );
      final url = supabase.storage.from('property-images').getPublicUrl(path);
      await supabase.from('property_images').insert({
        'property_id': propertyId,
        'url': url,
        'is_primary': i == 0,
        'order_index': i,
      });
    }
  }

  void _resetAndGoHome() {
    setState(() {
      _success = false;
      _step = 1;
      _images.clear();
      _titleController.clear();
      _priceController.clear();
      _addressController.clear();
      _surfaceController.clear();
      _descriptionController.clear();
      _minIncomeController.clear();
      _additionalController.clear();
      _keywords.clear();
      _cityId = null;
      _communeId = null;
    });
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    ref.listen(authProvider, (previous, next) {
      if (next.profile?.id != _lastCheckedProfileId) _checkPublishLimit();
    });
    final isPremium = ref.watch(subscriptionProvider).isPremium;

    if (auth.user == null) {
      return _GuardScreen(
        icon: LucideIcons.building2,
        iconColor: AppColors.primary,
        title: 'Connexion requise',
        message: "Connectez-vous ou créez un compte propriétaire pour publier votre bien.",
        buttonLabel: 'Se connecter',
        onPressed: () => context.push('/login'),
      );
    }

    if (_limitReached && !isPremium) {
      return _GuardScreen(
        icon: LucideIcons.crown,
        iconColor: AppColors.accent,
        title: 'Limite atteinte',
        message: 'Votre plan gratuit est limité à 1 annonce. Passez en Premium pour publier des annonces illimitées.',
        buttonLabel: 'Voir les offres Premium',
        onPressed: () => context.push('/subscription'),
      );
    }

    if (_success) {
      return _SuccessScreen(onDone: _resetAndGoHome);
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildStepIndicator(),
            Expanded(
              child: SingleChildScrollView(
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                padding: const EdgeInsets.fromLTRB(AppSpacing.xl, AppSpacing.xl, AppSpacing.xl, 40),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildStepContent(),
                    const SizedBox(height: AppSpacing.xxl),
                    _buildNavRow(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(AppSpacing.xl, AppSpacing.lg, AppSpacing.xl, AppSpacing.lg),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Publier un bien', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.text)),
                const SizedBox(height: 2),
                Text('Étape $_step / $_totalSteps', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepIndicator() {
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.md, horizontal: AppSpacing.lg),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(_totalSteps, (i) {
          final s = i + 1;
          final active = _step >= s;
          return Row(
            children: [
              Column(
                children: [
                  Container(
                    width: 26,
                    height: 26,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: active ? AppColors.primary : AppColors.border,
                    ),
                    child: Text(
                      '$s',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: active ? AppColors.textInverse : AppColors.textTertiary),
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    _stepLabels[i],
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w500, color: active ? AppColors.primary : AppColors.textTertiary),
                  ),
                ],
              ),
              if (s < _totalSteps)
                Container(
                  width: 24,
                  height: 2,
                  margin: const EdgeInsets.only(bottom: 14),
                  color: _step > s ? AppColors.primary : AppColors.border,
                ),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_step) {
      case 1:
        return _buildStep1();
      case 2:
        return _buildStep2();
      case 3:
        return _buildStep3();
      default:
        return _buildStep4();
    }
  }

  Widget _buildStep1() {
    final selectedCity = _cities.where((c) => c.id == _cityId).toList();
    final selectedCommune = _communes.where((c) => c.id == _communeId).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionTitle("Type d'annonce"),
        Row(
          children: [
            Expanded(child: _ListingTypeButton(label: 'À Louer', value: 'rent', groupValue: _listingType, onTap: (v) => setState(() => _listingType = v))),
            const SizedBox(width: AppSpacing.md),
            Expanded(child: _ListingTypeButton(label: 'À Vendre', value: 'sale', groupValue: _listingType, onTap: (v) => setState(() => _listingType = v))),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        AppInput(label: "Titre de l'annonce", placeholder: 'Ex: Belle villa meublée à Gombe', controller: _titleController),
        AppInput(
          label: 'Prix (USD${_listingType == 'rent' ? '/mois' : ''})',
          placeholder: 'Ex: 800',
          controller: _priceController,
          keyboardType: TextInputType.number,
        ),
        const _FieldLabel('Type de bien'),
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: _propertyTypes.map((t) {
            final selected = _propertyType == t.$1;
            return _Chip(label: t.$2, selected: selected, onTap: () => setState(() => _propertyType = t.$1));
          }).toList(),
        ),
        const SizedBox(height: AppSpacing.lg),
        const _FieldLabel('Ville'),
        _PickerField(
          value: selectedCity.isNotEmpty ? selectedCity.first.name : null,
          placeholder: 'Choisir une ville...',
          onTap: _openCityPicker,
        ),
        if (_cityId != null) ...[
          const _FieldLabel('Commune'),
          _PickerField(
            value: selectedCommune.isNotEmpty ? selectedCommune.first.name : null,
            placeholder: 'Choisir une commune...',
            onTap: _openCommunePicker,
          ),
        ],
        AppInput(label: 'Indice de localisation', placeholder: 'Ex: Près du rond-point Victoire', controller: _addressController),
      ],
    );
  }

  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionTitle('Détails du bien'),
        Row(
          children: [
            Expanded(child: AppInput(label: 'Chambres', placeholder: '3', controller: _bedroomsController, keyboardType: TextInputType.number)),
            const SizedBox(width: AppSpacing.md),
            Expanded(child: AppInput(label: 'Salles de bain', placeholder: '1', controller: _bathroomsController, keyboardType: TextInputType.number)),
          ],
        ),
        AppInput(label: 'Surface (m²)', placeholder: 'Ex: 150', controller: _surfaceController, keyboardType: TextInputType.number),
        AppInput(label: 'Description', placeholder: 'Décrivez votre bien en détail...', controller: _descriptionController, multiline: true, maxLines: 4),
        const _SectionTitle('Équipements'),
        _SwitchRow(label: 'Meublé', value: _isFurnished, onChanged: (v) => setState(() => _isFurnished = v)),
        _SwitchRow(label: 'Garage', value: _hasGarage, onChanged: (v) => setState(() => _hasGarage = v)),
        _SwitchRow(label: 'Piscine', value: _hasPool, onChanged: (v) => setState(() => _hasPool = v)),
        _SwitchRow(label: 'Jardin', value: _hasGarden, onChanged: (v) => setState(() => _hasGarden = v)),
        _SwitchRow(label: 'Sécurité', value: _hasSecurity, onChanged: (v) => setState(() => _hasSecurity = v)),
        const SizedBox(height: AppSpacing.lg),
        const _SectionTitle('Mots-clés'),
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: _keywordOptions.map((kw) => _Chip(label: kw, selected: _keywords.contains(kw), onTap: () => _toggleKeyword(kw))).toList(),
        ),
      ],
    );
  }

  Widget _buildStep3() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionTitle('Photos du bien'),
        const _SectionHint("Ajoutez jusqu'à 8 photos. La première photo sera l'image principale de votre annonce."),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: AppSpacing.lg),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: AppSpacing.sm,
            mainAxisSpacing: AppSpacing.sm,
          ),
          itemCount: _images.length + (_images.length < _maxPhotos ? 1 : 0),
          itemBuilder: (context, index) {
            if (index == _images.length) {
              return AnimatedScaleTap(
                onTap: _pickImages,
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColors.surfaceSecondary,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    border: Border.all(color: AppColors.border, width: 2),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(LucideIcons.imagePlus, size: 26, color: AppColors.textTertiary),
                      const SizedBox(height: 4),
                      const Text('Ajouter', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textTertiary)),
                      Text('${_images.length}/$_maxPhotos', style: const TextStyle(fontSize: 9, color: AppColors.textTertiary)),
                    ],
                  ),
                ),
              );
            }
            final img = _images[index];
            return Stack(
              children: [
                Positioned.fill(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    child: Image.file(File(img.path), fit: BoxFit.cover),
                  ),
                ),
                if (index == 0)
                  Positioned(
                    left: 4,
                    bottom: 4,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(6)),
                      child: const Text('Principale', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textInverse)),
                    ),
                  ),
                Positioned(
                  right: 4,
                  top: 4,
                  child: GestureDetector(
                    onTap: () => _removeImage(index),
                    child: Container(
                      width: 22,
                      height: 22,
                      alignment: Alignment.center,
                      decoration: const BoxDecoration(color: AppColors.overlayDark, shape: BoxShape.circle),
                      child: const Icon(LucideIcons.trash2, size: 12, color: AppColors.textInverse),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
        if (_images.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.xxl),
            alignment: Alignment.center,
            child: Column(
              children: [
                const Icon(LucideIcons.camera, size: 40, color: AppColors.border),
                const SizedBox(height: AppSpacing.sm),
                const Text('Aucune photo ajoutée', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textSecondary)),
                const SizedBox(height: 4),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  child: Text(
                    'Les annonces avec photos reçoivent 5x plus de contacts. Ajoutez au moins 3 photos.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13, color: AppColors.textTertiary, height: 1.4),
                  ),
                ),
              ],
            ),
          ),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(color: AppColors.infoLight, borderRadius: BorderRadius.circular(AppRadius.md)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text('Conseils pour de bonnes photos', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.info)),
              SizedBox(height: 6),
              Text('• Photographiez en journée avec bonne lumière', style: TextStyle(fontSize: 12, color: AppColors.info, height: 1.5)),
              Text('• Commencez par la façade ou le salon', style: TextStyle(fontSize: 12, color: AppColors.info, height: 1.5)),
              Text('• Montrez toutes les pièces principales', style: TextStyle(fontSize: 12, color: AppColors.info, height: 1.5)),
              Text('• Évitez les photos floues ou sombres', style: TextStyle(fontSize: 12, color: AppColors.info, height: 1.5)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStep4() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionTitle("Critères d'acceptation"),
        const _SectionHint('Ces critères seront visibles par les candidats pour qu\'ils puissent auto-évaluer leur profil.'),
        AppInput(label: 'Revenu mensuel minimum (USD)', placeholder: 'Ex: 500', controller: _minIncomeController, keyboardType: TextInputType.number),
        AppInput(label: "Nombre maximal d'occupants", placeholder: '4', controller: _maxOccupantsController, keyboardType: TextInputType.number),
        if (_listingType == 'rent')
          Row(
            children: [
              Expanded(child: AppInput(label: "Mois d'avance", placeholder: '1', controller: _advanceMonthsController, keyboardType: TextInputType.number)),
              const SizedBox(width: AppSpacing.md),
              Expanded(child: AppInput(label: 'Durée min. (mois)', placeholder: '6', controller: _minStayController, keyboardType: TextInputType.number)),
            ],
          ),
        _SwitchRow(label: 'Animaux acceptés', value: _petsAllowed, onChanged: (v) => setState(() => _petsAllowed = v)),
        _SwitchRow(label: 'Fumeurs acceptés', value: _smokingAllowed, onChanged: (v) => setState(() => _smokingAllowed = v)),
        _SwitchRow(label: 'Caution requise', value: _requiresGuarantor, onChanged: (v) => setState(() => _requiresGuarantor = v)),
        const SizedBox(height: AppSpacing.lg),
        AppInput(
          label: 'Exigences supplémentaires',
          placeholder: 'Tout autre critère important...',
          controller: _additionalController,
          multiline: true,
          maxLines: 3,
        ),
      ],
    );
  }

  Widget _buildNavRow() {
    return Row(
      children: [
        if (_step > 1)
          Expanded(
            child: AppButton(
              title: 'Précédent',
              variant: AppButtonVariant.outline,
              onPressed: _submitting ? null : () => setState(() => _step -= 1),
            ),
          ),
        if (_step > 1) const SizedBox(width: AppSpacing.md),
        Expanded(
          child: _step < _totalSteps
              ? AppButton(title: 'Suivant', onPressed: () => setState(() => _step += 1))
              : AppButton(title: "Soumettre l'annonce", loading: _submitting, onPressed: _submitting ? null : _submit),
        ),
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.sm, bottom: AppSpacing.md),
      child: Text(text, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.text)),
    );
  }
}

class _SectionHint extends StatelessWidget {
  final String text;
  const _SectionHint(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: Text(text, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4)),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  final String text;
  const _FieldLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(text.toUpperCase(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary, letterSpacing: 0.5)),
    );
  }
}

class _ListingTypeButton extends StatelessWidget {
  final String label;
  final String value;
  final String groupValue;
  final ValueChanged<String> onTap;

  const _ListingTypeButton({required this.label, required this.value, required this.groupValue, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final selected = value == groupValue;
    final activeColor = value == 'rent' ? AppColors.accent : AppColors.primary;
    final activeBg = value == 'rent' ? AppColors.rentLight : AppColors.saleLight;
    return AnimatedScaleTap(
      onTap: () => onTap(value),
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.lg),
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? activeBg : AppColors.surfaceSecondary,
          borderRadius: BorderRadius.circular(AppRadius.sm),
          border: Border.all(color: selected ? activeColor : AppColors.border, width: 1.5),
        ),
        child: Text(
          label,
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: selected ? AppColors.text : AppColors.textSecondary),
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _Chip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return AnimatedScaleTap(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 14),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary.withValues(alpha: 0.1) : AppColors.surfaceSecondary,
          borderRadius: BorderRadius.circular(AppRadius.full),
          border: Border.all(color: selected ? AppColors.primary : AppColors.border),
        ),
        child: Text(
          label,
          style: TextStyle(fontSize: 13, fontWeight: selected ? FontWeight.w700 : FontWeight.w500, color: selected ? AppColors.primary : AppColors.textSecondary),
        ),
      ),
    );
  }
}

class _SwitchRow extends StatelessWidget {
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _SwitchRow({required this.label, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.borderLight))),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 15, color: AppColors.text)),
          Switch(value: value, onChanged: onChanged, activeThumbColor: AppColors.textInverse, activeTrackColor: AppColors.primary),
        ],
      ),
    );
  }
}

class _PickerField extends StatelessWidget {
  final String? value;
  final String placeholder;
  final VoidCallback onTap;

  const _PickerField({required this.value, required this.placeholder, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return AnimatedScaleTap(
      scaleTo: 0.98,
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.lg),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.border, width: 1.5),
          color: AppColors.surface,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              value ?? placeholder,
              style: TextStyle(fontSize: 15, color: value != null ? AppColors.text : AppColors.textTertiary),
            ),
            const Icon(LucideIcons.chevronDown, size: 16, color: AppColors.textSecondary),
          ],
        ),
      ),
    );
  }
}

class _PickerSheet extends StatelessWidget {
  final String title;
  final List<_PickerOption> items;
  final String? selectedId;

  const _PickerSheet({required this.title, required this.items, required this.selectedId});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.7),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xxl)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(AppSpacing.xl),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.text)),
                  GestureDetector(onTap: () => Navigator.pop(context), child: const Icon(LucideIcons.x, size: 22, color: AppColors.text)),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.border),
            Flexible(
              child: items.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.all(AppSpacing.xxl),
                      child: Text('Aucun résultat', style: TextStyle(color: AppColors.textSecondary)),
                    )
                  : ListView.builder(
                      shrinkWrap: true,
                      itemCount: items.length,
                      itemBuilder: (context, index) {
                        final item = items[index];
                        final selected = item.id == selectedId;
                        return InkWell(
                          onTap: () => Navigator.pop(context, item.id),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: AppSpacing.xl),
                            decoration: BoxDecoration(
                              color: selected ? AppColors.primary.withValues(alpha: 0.06) : null,
                              border: const Border(bottom: BorderSide(color: AppColors.borderLight)),
                            ),
                            child: Text(
                              item.label,
                              style: TextStyle(fontSize: 15, color: selected ? AppColors.primary : AppColors.text, fontWeight: selected ? FontWeight.w700 : FontWeight.w400),
                            ),
                          ),
                        );
                      },
                    ),
            ),
            const SizedBox(height: AppSpacing.lg),
          ],
        ),
      ),
    );
  }
}

class _GuardScreen extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String message;
  final String buttonLabel;
  final VoidCallback onPressed;

  const _GuardScreen({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.message,
    required this.buttonLabel,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(AppSpacing.xl, AppSpacing.lg, AppSpacing.xl, AppSpacing.lg),
              decoration: const BoxDecoration(color: AppColors.surface, border: Border(bottom: BorderSide(color: AppColors.border))),
              child: const Text('Publier un bien', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.text)),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.xxxl),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(icon, size: 48, color: iconColor),
                    const SizedBox(height: AppSpacing.lg),
                    Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.text)),
                    const SizedBox(height: AppSpacing.sm),
                    Text(message, textAlign: TextAlign.center, style: const TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5)),
                    const SizedBox(height: AppSpacing.xl),
                    AppButton(title: buttonLabel, onPressed: onPressed),
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

class _SuccessScreen extends StatelessWidget {
  final VoidCallback onDone;
  const _SuccessScreen({required this.onDone});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xxxl),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 96,
                  height: 96,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(color: AppColors.successLight, shape: BoxShape.circle),
                  child: const Icon(LucideIcons.checkCircle, size: 56, color: AppColors.success),
                ),
                const SizedBox(height: AppSpacing.xl),
                const Text('Annonce soumise !', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.text)),
                const SizedBox(height: AppSpacing.md),
                const Text(
                  'Votre annonce est en cours de vérification par notre équipe. Elle sera publiée après validation.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 15, color: AppColors.textSecondary, height: 1.5),
                ),
                const SizedBox(height: AppSpacing.xxl),
                AppButton(title: "Retour à l'accueil", onPressed: onDone),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
