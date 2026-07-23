import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/supabase_client.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/animated_scale_tap.dart';
import '../../widgets/app_button.dart';
import '../../widgets/skeleton.dart';

const _placeholderImage = 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400';
const _monthsFr = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

String _formatDate(DateTime date) => '${date.day} ${_monthsFr[date.month - 1]} ${date.year}';

class _StatusInfo {
  final String label;
  final Color color;
  final Color bg;
  final IconData icon;
  const _StatusInfo(this.label, this.color, this.bg, this.icon);
}

const _statusConfig = <String, _StatusInfo>{
  'pending': _StatusInfo('En attente', AppColors.warning, AppColors.warningLight, LucideIcons.clock),
  'reviewed': _StatusInfo('Examinée', AppColors.info, AppColors.infoLight, LucideIcons.eye),
  'accepted': _StatusInfo('Acceptée', AppColors.success, AppColors.successLight, LucideIcons.checkCircle),
  'rejected': _StatusInfo('Refusée', AppColors.error, AppColors.errorLight, LucideIcons.xCircle),
};

class _RequestItem {
  final String id;
  final String status;
  final String message;
  final DateTime createdAt;
  final String? propertyId;
  final String propertyTitle;
  final double price;
  final String listingType;
  final String cityName;
  final String imageUrl;

  _RequestItem({
    required this.id,
    required this.status,
    required this.message,
    required this.createdAt,
    required this.propertyId,
    required this.propertyTitle,
    required this.price,
    required this.listingType,
    required this.cityName,
    required this.imageUrl,
  });

  factory _RequestItem.fromJson(Map<String, dynamic> json) {
    final property = json['property'] as Map<String, dynamic>?;
    final images = (property?['property_images'] as List?)?.cast<Map<String, dynamic>>() ?? const [];
    final primary = images.where((i) => i['is_primary'] == true).toList();
    final imageUrl = primary.isNotEmpty
        ? primary.first['url'] as String
        : (images.isNotEmpty ? images.first['url'] as String : _placeholderImage);
    final city = property?['city'] as Map<String, dynamic>?;
    return _RequestItem(
      id: json['id'] as String,
      status: json['status'] as String? ?? 'pending',
      message: json['message'] as String? ?? '',
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ?? DateTime.now(),
      propertyId: property?['id'] as String?,
      propertyTitle: property?['title'] as String? ?? 'Bien immobilier',
      price: (property?['price'] as num?)?.toDouble() ?? 0,
      listingType: property?['listing_type'] as String? ?? 'rent',
      cityName: city?['name'] as String? ?? '',
      imageUrl: imageUrl,
    );
  }
}

class MyRequestsScreen extends ConsumerStatefulWidget {
  const MyRequestsScreen({super.key});

  @override
  ConsumerState<MyRequestsScreen> createState() => _MyRequestsScreenState();
}

class _MyRequestsScreenState extends ConsumerState<MyRequestsScreen> {
  bool _loading = true;
  List<_RequestItem> _requests = [];
  String? _openingId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final userId = ref.read(authProvider).user?.id;
    if (userId == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    if (mounted) setState(() => _loading = true);
    final data = await supabase.from('tenant_interests').select('''
          id, status, message, created_at,
          property:properties(
            id, title, price, listing_type,
            property_images(url, is_primary),
            city:cities(name)
          )
        ''').eq('tenant_id', userId).order('created_at', ascending: false);
    if (!mounted) return;
    setState(() {
      _requests = (data as List).map((e) => _RequestItem.fromJson(e as Map<String, dynamic>)).toList();
      _loading = false;
    });
  }

  Future<void> _openConversation(_RequestItem item) async {
    final userId = ref.read(authProvider).user?.id;
    if (userId == null || item.propertyId == null) return;
    setState(() => _openingId = item.id);
    final conv = await supabase
        .from('conversations')
        .select('id')
        .eq('property_id', item.propertyId!)
        .eq('tenant_id', userId)
        .maybeSingle();
    if (mounted) setState(() => _openingId = null);
    if (conv != null && mounted) {
      context.push('/conversation/${conv['id']}');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: _loading
                  ? const RowSkeletonList(count: 4)
                  : _requests.isEmpty
                      ? _buildEmpty()
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(AppSpacing.lg),
                            itemCount: _requests.length,
                            itemBuilder: (context, index) {
                              final item = _requests[index];
                              return _RequestCard(
                                item: item,
                                opening: _openingId == item.id,
                                onTap: item.propertyId != null ? () => context.push('/property/${item.propertyId}') : null,
                                onOpenConversation: () => _openConversation(item),
                              );
                            },
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
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: const BoxDecoration(color: AppColors.surface, border: Border(bottom: BorderSide(color: AppColors.border))),
      child: Row(
        children: [
          AnimatedScaleTap(
            onTap: () => context.pop(),
            child: Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: AppColors.surfaceSecondary, borderRadius: BorderRadius.circular(AppRadius.md)),
              child: const Icon(LucideIcons.arrowLeft, size: 20, color: AppColors.text),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Mes Demandes', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.text)),
                Text(
                  '${_requests.length} demande${_requests.length != 1 ? 's' : ''}',
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Aucune demande', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.text)),
            const SizedBox(height: AppSpacing.sm),
            const Text(
              "Manifestez votre intérêt pour un bien et suivez l'avancement de vos demandes ici.",
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
            ),
            const SizedBox(height: AppSpacing.xl),
            AppButton(title: 'Parcourir les biens', onPressed: () => context.go('/home')),
          ],
        ),
      ),
    );
  }
}

class _RequestCard extends StatelessWidget {
  final _RequestItem item;
  final bool opening;
  final VoidCallback? onTap;
  final VoidCallback onOpenConversation;

  const _RequestCard({required this.item, required this.opening, required this.onTap, required this.onOpenConversation});

  @override
  Widget build(BuildContext context) {
    final status = _statusConfig[item.status] ?? _statusConfig['pending']!;
    final priceFormat = NumberFormat('#,##0', 'fr_FR');

    return AnimatedScaleTap(
      scaleTo: 0.98,
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          boxShadow: AppShadows.sm,
        ),
        clipBehavior: Clip.antiAlias,
        child: Row(
          children: [
            SizedBox(
              width: 100,
              height: 130,
              child: CachedNetworkImage(imageUrl: item.imageUrl, fit: BoxFit.cover),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(color: status.bg, borderRadius: BorderRadius.circular(8)),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(status.icon, size: 12, color: status.color),
                              const SizedBox(width: 4),
                              Text(status.label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: status.color)),
                            ],
                          ),
                        ),
                        Text(_formatDate(item.createdAt), style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                      ],
                    ),
                    Text(
                      item.propertyTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.text),
                    ),
                    Text(
                      '\$${priceFormat.format(item.price)}${item.listingType == 'rent' ? '/mois' : ''}',
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.primary),
                    ),
                    if (item.status == 'accepted')
                      AnimatedScaleTap(
                        onTap: opening ? null : onOpenConversation,
                        child: Container(
                          margin: const EdgeInsets.only(top: 4),
                          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
                          decoration: BoxDecoration(color: AppColors.saleLight, borderRadius: BorderRadius.circular(8)),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (opening)
                                const SizedBox(
                                  width: 12,
                                  height: 12,
                                  child: CircularProgressIndicator(strokeWidth: 1.5, color: AppColors.primary),
                                )
                              else
                                const Icon(LucideIcons.messageCircle, size: 14, color: AppColors.primary),
                              const SizedBox(width: 6),
                              const Text('Ouvrir la conversation', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary)),
                            ],
                          ),
                        ),
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
