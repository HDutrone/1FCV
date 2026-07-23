import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../core/theme.dart';
import '../models/models.dart';
import 'animated_scale_tap.dart';
import 'app_button.dart';
import 'app_input.dart';

const _propertyTypes = [
  (value: 'house', label: 'Maison'),
  (value: 'apartment', label: 'Appartement'),
  (value: 'villa', label: 'Villa'),
  (value: 'studio', label: 'Studio'),
  (value: 'commercial', label: 'Commercial'),
  (value: 'land', label: 'Terrain'),
];

void showAdvancedFiltersModal(
  BuildContext context, {
  required PropertyFilters filters,
  required ValueChanged<PropertyFilters> onApply,
}) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => _AdvancedFiltersSheet(filters: filters, onApply: onApply),
  );
}

class _AdvancedFiltersSheet extends StatefulWidget {
  final PropertyFilters filters;
  final ValueChanged<PropertyFilters> onApply;

  const _AdvancedFiltersSheet({required this.filters, required this.onApply});

  @override
  State<_AdvancedFiltersSheet> createState() => _AdvancedFiltersSheetState();
}

class _AdvancedFiltersSheetState extends State<_AdvancedFiltersSheet> {
  late PropertyFilters _local;
  late TextEditingController _minPriceCtrl;
  late TextEditingController _maxPriceCtrl;
  late TextEditingController _minBedroomsCtrl;
  late TextEditingController _minBathroomsCtrl;
  late TextEditingController _minAreaCtrl;
  late TextEditingController _maxAreaCtrl;

  @override
  void initState() {
    super.initState();
    _local = widget.filters;
    _minPriceCtrl = TextEditingController(text: _local.minPrice?.toStringAsFixed(0) ?? '');
    _maxPriceCtrl = TextEditingController(text: _local.maxPrice?.toStringAsFixed(0) ?? '');
    _minBedroomsCtrl = TextEditingController(text: _local.minBedrooms?.toString() ?? '');
    _minBathroomsCtrl = TextEditingController(text: _local.minBathrooms?.toString() ?? '');
    _minAreaCtrl = TextEditingController(text: _local.minArea?.toStringAsFixed(0) ?? '');
    _maxAreaCtrl = TextEditingController(text: _local.maxArea?.toStringAsFixed(0) ?? '');
  }

  @override
  void dispose() {
    _minPriceCtrl.dispose();
    _maxPriceCtrl.dispose();
    _minBedroomsCtrl.dispose();
    _minBathroomsCtrl.dispose();
    _minAreaCtrl.dispose();
    _maxAreaCtrl.dispose();
    super.dispose();
  }

  void _reset() {
    setState(() {
      _local = PropertyFilters(
        listingType: _local.listingType,
        cityId: _local.cityId,
        communeId: _local.communeId,
      );
      _minPriceCtrl.text = '';
      _maxPriceCtrl.text = '';
      _minBedroomsCtrl.text = '';
      _minBathroomsCtrl.text = '';
      _minAreaCtrl.text = '';
      _maxAreaCtrl.text = '';
    });
  }

  void _apply() {
    widget.onApply(_local);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.9),
        child: DecoratedBox(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xxl)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(AppSpacing.xl),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: AppColors.border)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: const Icon(LucideIcons.x, size: 22, color: AppColors.text),
                    ),
                    const Text('Filtres avancés', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.text)),
                    AnimatedScaleTap(
                      onTap: _reset,
                      child: Row(
                        children: const [
                          Icon(LucideIcons.rotateCcw, size: 14, color: AppColors.primary),
                          SizedBox(width: 4),
                          Text('Réinitialiser', style: TextStyle(fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const _SectionTitle('Type de bien'),
                      Wrap(
                        spacing: AppSpacing.sm,
                        runSpacing: AppSpacing.sm,
                        children: [
                          for (final type in _propertyTypes)
                            _TypeChip(
                              label: type.label,
                              active: _local.propertyType == type.value,
                              onTap: () => setState(() {
                                _local = _local.copyWith(
                                  propertyType: _local.propertyType == type.value ? null : type.value,
                                );
                              }),
                            ),
                        ],
                      ),
                      const _SectionTitle('Budget (USD)'),
                      Row(
                        children: [
                          Expanded(
                            child: AppInput(
                              label: 'Min',
                              placeholder: '0',
                              controller: _minPriceCtrl,
                              keyboardType: TextInputType.number,
                              onChanged: (v) => _local = _local.copyWith(minPrice: v.isEmpty ? null : double.tryParse(v)),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: AppInput(
                              label: 'Max',
                              placeholder: 'Illimité',
                              controller: _maxPriceCtrl,
                              keyboardType: TextInputType.number,
                              onChanged: (v) => _local = _local.copyWith(maxPrice: v.isEmpty ? null : double.tryParse(v)),
                            ),
                          ),
                        ],
                      ),
                      const _SectionTitle('Nombre de pièces'),
                      Row(
                        children: [
                          Expanded(
                            child: AppInput(
                              label: 'Chambres min.',
                              placeholder: '0',
                              controller: _minBedroomsCtrl,
                              keyboardType: TextInputType.number,
                              onChanged: (v) => _local = _local.copyWith(minBedrooms: v.isEmpty ? null : int.tryParse(v)),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: AppInput(
                              label: 'SDB min.',
                              placeholder: '0',
                              controller: _minBathroomsCtrl,
                              keyboardType: TextInputType.number,
                              onChanged: (v) => _local = _local.copyWith(minBathrooms: v.isEmpty ? null : int.tryParse(v)),
                            ),
                          ),
                        ],
                      ),
                      const _SectionTitle('Surface (m²)'),
                      Row(
                        children: [
                          Expanded(
                            child: AppInput(
                              label: 'Min',
                              placeholder: '0',
                              controller: _minAreaCtrl,
                              keyboardType: TextInputType.number,
                              onChanged: (v) => _local = _local.copyWith(minArea: v.isEmpty ? null : double.tryParse(v)),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: AppInput(
                              label: 'Max',
                              placeholder: 'Illimité',
                              controller: _maxAreaCtrl,
                              keyboardType: TextInputType.number,
                              onChanged: (v) => _local = _local.copyWith(maxArea: v.isEmpty ? null : double.tryParse(v)),
                            ),
                          ),
                        ],
                      ),
                      const _SectionTitle('Équipements'),
                      _SwitchRow(
                        label: 'Meublé',
                        value: _local.isFurnished ?? false,
                        onChanged: (v) => setState(() => _local = _local.copyWith(isFurnished: v ? true : null)),
                      ),
                      _SwitchRow(
                        label: 'Garage',
                        value: _local.hasGarage ?? false,
                        onChanged: (v) => setState(() => _local = _local.copyWith(hasGarage: v ? true : null)),
                      ),
                      _SwitchRow(
                        label: 'Piscine',
                        value: _local.hasPool ?? false,
                        onChanged: (v) => setState(() => _local = _local.copyWith(hasPool: v ? true : null)),
                      ),
                      _SwitchRow(
                        label: 'Jardin',
                        value: _local.hasGarden ?? false,
                        onChanged: (v) => setState(() => _local = _local.copyWith(hasGarden: v ? true : null)),
                      ),
                      _SwitchRow(
                        label: 'Sécurité',
                        value: _local.hasSecurity ?? false,
                        onChanged: (v) => setState(() => _local = _local.copyWith(hasSecurity: v ? true : null)),
                        isLast: true,
                      ),
                    ],
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.fromLTRB(AppSpacing.xl, AppSpacing.lg, AppSpacing.xl, AppSpacing.xxl),
                decoration: const BoxDecoration(
                  border: Border(top: BorderSide(color: AppColors.border)),
                ),
                child: AppButton(
                  title: _local.activeAdvancedCount > 0 ? 'Appliquer (${_local.activeAdvancedCount})' : 'Appliquer',
                  size: AppButtonSize.lg,
                  onPressed: _apply,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.sm, bottom: AppSpacing.sm),
      child: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.text)),
    );
  }
}

class _TypeChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _TypeChip({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return AnimatedScaleTap(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm, horizontal: AppSpacing.md + 2),
        decoration: BoxDecoration(
          color: active ? AppColors.primaryLight.withValues(alpha: 0.12) : AppColors.surfaceSecondary,
          borderRadius: BorderRadius.circular(AppRadius.full),
          border: Border.all(color: active ? AppColors.primary : AppColors.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: active ? FontWeight.w600 : FontWeight.w500,
            color: active ? AppColors.primary : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _SwitchRow extends StatelessWidget {
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;
  final bool isLast;

  const _SwitchRow({required this.label, required this.value, required this.onChanged, this.isLast = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm + 2),
      decoration: BoxDecoration(
        border: isLast ? null : const Border(bottom: BorderSide(color: AppColors.borderLight)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 15, color: AppColors.text)),
          Switch(
            value: value,
            onChanged: onChanged,
            activeThumbColor: AppColors.textInverse,
            activeTrackColor: AppColors.primary,
          ),
        ],
      ),
    );
  }
}
