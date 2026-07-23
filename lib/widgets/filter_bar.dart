import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../core/theme.dart';
import '../data/locations_repository.dart';
import '../models/models.dart';
import '../providers/mode_provider.dart';
import 'advanced_filters_modal.dart';
import 'animated_scale_tap.dart';

class FilterBar extends ConsumerStatefulWidget {
  final PropertyFilters filters;
  final ValueChanged<PropertyFilters> onFiltersChange;

  const FilterBar({super.key, required this.filters, required this.onFiltersChange});

  @override
  ConsumerState<FilterBar> createState() => _FilterBarState();
}

T? _findById<T>(List<T> items, String? id, {required String Function(T) idOf}) {
  if (id == null) return null;
  for (final item in items) {
    if (idOf(item) == id) return item;
  }
  return null;
}

class _FilterBarState extends ConsumerState<FilterBar> {
  List<City> _cities = [];
  List<Commune> _communes = [];

  @override
  void initState() {
    super.initState();
    _loadCities();
    if (widget.filters.cityId != null) _loadCommunes(widget.filters.cityId!);
  }

  @override
  void didUpdateWidget(covariant FilterBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.filters.cityId != widget.filters.cityId) {
      if (widget.filters.cityId != null) {
        _loadCommunes(widget.filters.cityId!);
      } else {
        setState(() => _communes = []);
      }
    }
  }

  Future<void> _loadCities() async {
    final cities = await locationsRepository.fetchCities();
    if (mounted) setState(() => _cities = cities);
  }

  Future<void> _loadCommunes(String cityId) async {
    final communes = await locationsRepository.fetchCommunes(cityId);
    if (mounted) setState(() => _communes = communes);
  }

  void _setMode(String mode) {
    ref.read(modeProvider.notifier).setMode(mode);
    widget.onFiltersChange(widget.filters.copyWith(listingType: mode));
  }

  void _openCityPicker() {
    _showPickerSheet(
      title: 'Choisir une ville',
      items: _cities.map((c) => (id: c.id, name: c.name)).toList(),
      selectedId: widget.filters.cityId,
      onSelect: (id) {
        widget.onFiltersChange(widget.filters.copyWith(
          cityId: id,
          communeId: null,
        ));
      },
    );
  }

  void _openCommunePicker() {
    _showPickerSheet(
      title: 'Choisir une commune',
      items: _communes.map((c) => (id: c.id, name: c.name)).toList(),
      selectedId: widget.filters.communeId,
      onSelect: (id) {
        widget.onFiltersChange(widget.filters.copyWith(communeId: id));
      },
    );
  }

  void _showPickerSheet({
    required String title,
    required List<({String id, String name})> items,
    required String? selectedId,
    required ValueChanged<String?> onSelect,
  }) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
      ),
      constraints: const BoxConstraints(),
      builder: (context) {
        return SafeArea(
          top: false,
          child: ConstrainedBox(
            constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.7),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.text)),
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: const Icon(LucideIcons.x, size: 20, color: AppColors.text),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1, color: AppColors.border),
                Flexible(
                  child: ListView(
                    shrinkWrap: true,
                    children: [
                      ListTile(
                        title: const Text('Toutes les options', style: TextStyle(fontSize: 15, color: AppColors.textSecondary)),
                        onTap: () {
                          onSelect(null);
                          Navigator.pop(context);
                        },
                      ),
                      for (final item in items)
                        ListTile(
                          tileColor: selectedId == item.id ? AppColors.primaryLight.withValues(alpha: 0.08) : null,
                          title: Text(
                            item.name,
                            style: TextStyle(
                              fontSize: 15,
                              color: selectedId == item.id ? AppColors.primary : AppColors.text,
                              fontWeight: selectedId == item.id ? FontWeight.w600 : FontWeight.w400,
                            ),
                          ),
                          onTap: () {
                            onSelect(item.id);
                            Navigator.pop(context);
                          },
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),
              ],
            ),
          ),
        );
      },
    );
  }

  void _openAdvanced() {
    showAdvancedFiltersModal(
      context,
      filters: widget.filters,
      onApply: widget.onFiltersChange,
    );
  }

  @override
  Widget build(BuildContext context) {
    final mode = ref.watch(modeProvider).mode;
    final selectedCity = _findById<City>(_cities, widget.filters.cityId, idOf: (c) => c.id);
    final selectedCommune = _findById<Commune>(_communes, widget.filters.communeId, idOf: (c) => c.id);

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.border, width: 1)),
      ),
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, AppSpacing.sm),
            child: Row(
              children: [
                Expanded(
                  child: _ModeButton(
                    label: 'Location',
                    active: mode == 'rent',
                    activeColor: AppColors.accent,
                    onTap: () => _setMode('rent'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: _ModeButton(
                    label: 'Achat',
                    active: mode == 'sale',
                    activeColor: AppColors.primary,
                    onTap: () => _setMode('sale'),
                  ),
                ),
              ],
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: Row(
              children: [
                _FilterChip(
                  label: selectedCity?.name ?? 'Ville',
                  active: selectedCity != null,
                  onTap: _openCityPicker,
                  onClear: selectedCity != null
                      ? () => widget.onFiltersChange(widget.filters.copyWith(cityId: null, communeId: null))
                      : null,
                ),
                if (widget.filters.cityId != null) ...[
                  const SizedBox(width: AppSpacing.sm),
                  _FilterChip(
                    label: selectedCommune?.name ?? 'Commune',
                    active: selectedCommune != null,
                    onTap: _openCommunePicker,
                    onClear: selectedCommune != null
                        ? () => widget.onFiltersChange(widget.filters.copyWith(communeId: null))
                        : null,
                  ),
                ],
                const SizedBox(width: AppSpacing.sm),
                AnimatedScaleTap(
                  onTap: _openAdvanced,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm, horizontal: AppSpacing.md),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceSecondary,
                      borderRadius: BorderRadius.circular(AppRadius.full),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        const Icon(LucideIcons.slidersHorizontal, size: 14, color: AppColors.textSecondary),
                        const SizedBox(width: AppSpacing.xs),
                        Text(
                          widget.filters.activeAdvancedCount > 0
                              ? 'Filtres (${widget.filters.activeAdvancedCount})'
                              : 'Filtres',
                          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ModeButton extends StatelessWidget {
  final String label;
  final bool active;
  final Color activeColor;
  final VoidCallback onTap;

  const _ModeButton({required this.label, required this.active, required this.activeColor, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return AnimatedScaleTap(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm + 2),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: active ? activeColor.withValues(alpha: 0.12) : AppColors.surfaceSecondary,
          borderRadius: BorderRadius.circular(AppRadius.sm + 2),
          border: Border.all(color: active ? activeColor : AppColors.border, width: 1.5),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: active ? AppColors.primary : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  final VoidCallback? onClear;

  const _FilterChip({required this.label, required this.active, required this.onTap, this.onClear});

  @override
  Widget build(BuildContext context) {
    return AnimatedScaleTap(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm, horizontal: AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.surfaceSecondary,
          borderRadius: BorderRadius.circular(AppRadius.full),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                color: active ? AppColors.primary : AppColors.textSecondary,
                fontWeight: active ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
            const SizedBox(width: 4),
            Icon(LucideIcons.chevronDown, size: 13, color: active ? AppColors.primary : AppColors.textSecondary),
            if (onClear != null) ...[
              const SizedBox(width: 4),
              GestureDetector(
                onTap: onClear,
                child: const Icon(LucideIcons.x, size: 12, color: AppColors.primary),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
