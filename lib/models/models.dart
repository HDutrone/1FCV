import 'package:flutter/material.dart';

class City {
  final String id;
  final String name;

  City({required this.id, required this.name});

  factory City.fromJson(Map<String, dynamic> json) =>
      City(id: json['id'] as String, name: json['name'] as String);
}

class Commune {
  final String id;
  final String cityId;
  final String name;

  Commune({required this.id, required this.cityId, required this.name});

  factory Commune.fromJson(Map<String, dynamic> json) => Commune(
        id: json['id'] as String,
        cityId: json['city_id'] as String? ?? '',
        name: json['name'] as String,
      );
}

class Profile {
  final String id;
  final String displayName;
  final String anonymousId;
  final String role;
  final String? avatarUrl;
  final String? cityId;
  final String? communeId;
  final String bio;
  final bool isVerified;
  final double commissionRate;
  final bool kycVerified;
  final String agencyName;
  final String phoneNumber;
  final String status;

  Profile({
    required this.id,
    required this.displayName,
    required this.anonymousId,
    required this.role,
    this.avatarUrl,
    this.cityId,
    this.communeId,
    required this.bio,
    required this.isVerified,
    required this.commissionRate,
    required this.kycVerified,
    required this.agencyName,
    required this.phoneNumber,
    this.status = 'active',
  });

  factory Profile.fromJson(Map<String, dynamic> json) => Profile(
        id: json['id'] as String,
        displayName: json['display_name'] as String? ?? '',
        anonymousId: json['anonymous_id'] as String? ?? '',
        role: json['role'] as String? ?? 'tenant',
        avatarUrl: json['avatar_url'] as String?,
        cityId: json['city_id'] as String?,
        communeId: json['commune_id'] as String?,
        bio: json['bio'] as String? ?? '',
        isVerified: json['is_verified'] as bool? ?? false,
        commissionRate: (json['commission_rate'] as num?)?.toDouble() ?? 0.5,
        kycVerified: json['kyc_verified'] as bool? ?? false,
        agencyName: json['agency_name'] as String? ?? '',
        phoneNumber: json['phone_number'] as String? ?? '',
        status: json['status'] as String? ?? 'active',
      );
}

class PropertyImage {
  final String id;
  final String url;
  final bool isPrimary;
  final int orderIndex;

  PropertyImage({required this.id, required this.url, required this.isPrimary, required this.orderIndex});

  factory PropertyImage.fromJson(Map<String, dynamic> json) => PropertyImage(
        id: json['id'] as String? ?? '',
        url: json['url'] as String,
        isPrimary: json['is_primary'] as bool? ?? false,
        orderIndex: json['order_index'] as int? ?? 0,
      );
}

class OwnerCriteria {
  final double? minMonthlyIncome;
  final int maxOccupants;
  final List<String> allowedProfiles;
  final bool petsAllowed;
  final bool smokingAllowed;
  final int minStayMonths;
  final bool requiresGuarantor;
  final int advanceMonths;
  final String additionalRequirements;

  OwnerCriteria({
    this.minMonthlyIncome,
    required this.maxOccupants,
    required this.allowedProfiles,
    required this.petsAllowed,
    required this.smokingAllowed,
    required this.minStayMonths,
    required this.requiresGuarantor,
    required this.advanceMonths,
    required this.additionalRequirements,
  });

  factory OwnerCriteria.fromJson(Map<String, dynamic> json) => OwnerCriteria(
        minMonthlyIncome: (json['min_monthly_income'] as num?)?.toDouble(),
        maxOccupants: json['max_occupants'] as int? ?? 10,
        allowedProfiles: (json['allowed_profiles'] as List?)?.map((e) => e.toString()).toList() ?? [],
        petsAllowed: json['pets_allowed'] as bool? ?? false,
        smokingAllowed: json['smoking_allowed'] as bool? ?? false,
        minStayMonths: json['min_stay_months'] as int? ?? 1,
        requiresGuarantor: json['requires_guarantor'] as bool? ?? false,
        advanceMonths: json['advance_months'] as int? ?? 1,
        additionalRequirements: json['additional_requirements'] as String? ?? '',
      );
}

class Property {
  final String id;
  final String ownerId;
  final String listingType;
  final String title;
  final String description;
  final double price;
  final String currency;
  final int bedrooms;
  final int bathrooms;
  final double surfaceArea;
  final String? cityId;
  final String? communeId;
  final String addressHint;
  final String propertyType;
  final String status;
  final bool isFurnished;
  final bool hasGarage;
  final bool hasPool;
  final bool hasGarden;
  final bool hasSecurity;
  final List<String> keywords;
  final int viewsCount;
  final String createdAt;
  final City? city;
  final Commune? commune;
  final List<PropertyImage> images;
  final OwnerCriteria? ownerCriteria;

  Property({
    required this.id,
    required this.ownerId,
    required this.listingType,
    required this.title,
    required this.description,
    required this.price,
    required this.currency,
    required this.bedrooms,
    required this.bathrooms,
    required this.surfaceArea,
    this.cityId,
    this.communeId,
    required this.addressHint,
    required this.propertyType,
    required this.status,
    required this.isFurnished,
    required this.hasGarage,
    required this.hasPool,
    required this.hasGarden,
    required this.hasSecurity,
    required this.keywords,
    required this.viewsCount,
    required this.createdAt,
    this.city,
    this.commune,
    this.images = const [],
    this.ownerCriteria,
  });

  factory Property.fromJson(Map<String, dynamic> json) => Property(
        id: json['id'] as String,
        ownerId: json['owner_id'] as String? ?? '',
        listingType: json['listing_type'] as String? ?? 'rent',
        title: json['title'] as String? ?? '',
        description: json['description'] as String? ?? '',
        price: (json['price'] as num?)?.toDouble() ?? 0,
        currency: json['currency'] as String? ?? 'USD',
        bedrooms: json['bedrooms'] as int? ?? 0,
        bathrooms: json['bathrooms'] as int? ?? 0,
        surfaceArea: (json['surface_area'] as num?)?.toDouble() ?? 0,
        cityId: json['city_id'] as String?,
        communeId: json['commune_id'] as String?,
        addressHint: json['address_hint'] as String? ?? '',
        propertyType: json['property_type'] as String? ?? 'house',
        status: json['status'] as String? ?? 'pending',
        isFurnished: json['is_furnished'] as bool? ?? false,
        hasGarage: json['has_garage'] as bool? ?? false,
        hasPool: json['has_pool'] as bool? ?? false,
        hasGarden: json['has_garden'] as bool? ?? false,
        hasSecurity: json['has_security'] as bool? ?? false,
        keywords: (json['keywords'] as List?)?.map((e) => e.toString()).toList() ?? [],
        viewsCount: json['views_count'] as int? ?? 0,
        createdAt: json['created_at'] as String? ?? '',
        city: json['city'] != null ? City.fromJson(json['city'] as Map<String, dynamic>) : null,
        commune: json['commune'] != null ? Commune.fromJson(json['commune'] as Map<String, dynamic>) : null,
        images: (json['property_images'] as List?)
                ?.map((e) => PropertyImage.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
        ownerCriteria: _parseOwnerCriteria(json['owner_criteria']),
      );

  // owner_criteria has a UNIQUE foreign key to properties (one-to-one), so
  // PostgREST embeds it as a single object rather than a list; other
  // relationships (property_images, tenant_interests) stay arrays. Handle
  // both shapes defensively since this differs by relationship type.
  static OwnerCriteria? _parseOwnerCriteria(dynamic raw) {
    if (raw == null) return null;
    if (raw is Map<String, dynamic>) return OwnerCriteria.fromJson(raw);
    if (raw is List && raw.isNotEmpty) return OwnerCriteria.fromJson(raw.first as Map<String, dynamic>);
    return null;
  }

  // null/empty means "no photo uploaded" — callers must render a local,
  // network-independent placeholder rather than hotlinking a stock photo.
  String? get primaryImageUrl {
    if (images.isEmpty) return null;
    final primary = images.where((i) => i.isPrimary).toList();
    return primary.isNotEmpty ? primary.first.url : images.first.url;
  }

  List<String> get orderedImageUrls {
    if (images.isEmpty) return [];
    final sorted = [...images]..sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
    return sorted.map((e) => e.url).toList();
  }
}

class PropertyFilters {
  final String listingType;
  final String? cityId;
  final String? communeId;
  final double? minPrice;
  final double? maxPrice;
  final String? propertyType;
  final int? minBedrooms;
  final int? minBathrooms;
  final double? minArea;
  final double? maxArea;
  final bool? isFurnished;
  final bool? hasGarage;
  final bool? hasPool;
  final bool? hasGarden;
  final bool? hasSecurity;

  const PropertyFilters({
    required this.listingType,
    this.cityId,
    this.communeId,
    this.minPrice,
    this.maxPrice,
    this.propertyType,
    this.minBedrooms,
    this.minBathrooms,
    this.minArea,
    this.maxArea,
    this.isFurnished,
    this.hasGarage,
    this.hasPool,
    this.hasGarden,
    this.hasSecurity,
  });

  PropertyFilters copyWith({
    String? listingType,
    Object? cityId = _unset,
    Object? communeId = _unset,
    Object? minPrice = _unset,
    Object? maxPrice = _unset,
    Object? propertyType = _unset,
    Object? minBedrooms = _unset,
    Object? minBathrooms = _unset,
    Object? minArea = _unset,
    Object? maxArea = _unset,
    Object? isFurnished = _unset,
    Object? hasGarage = _unset,
    Object? hasPool = _unset,
    Object? hasGarden = _unset,
    Object? hasSecurity = _unset,
  }) {
    return PropertyFilters(
      listingType: listingType ?? this.listingType,
      cityId: cityId == _unset ? this.cityId : cityId as String?,
      communeId: communeId == _unset ? this.communeId : communeId as String?,
      minPrice: minPrice == _unset ? this.minPrice : minPrice as double?,
      maxPrice: maxPrice == _unset ? this.maxPrice : maxPrice as double?,
      propertyType: propertyType == _unset ? this.propertyType : propertyType as String?,
      minBedrooms: minBedrooms == _unset ? this.minBedrooms : minBedrooms as int?,
      minBathrooms: minBathrooms == _unset ? this.minBathrooms : minBathrooms as int?,
      minArea: minArea == _unset ? this.minArea : minArea as double?,
      maxArea: maxArea == _unset ? this.maxArea : maxArea as double?,
      isFurnished: isFurnished == _unset ? this.isFurnished : isFurnished as bool?,
      hasGarage: hasGarage == _unset ? this.hasGarage : hasGarage as bool?,
      hasPool: hasPool == _unset ? this.hasPool : hasPool as bool?,
      hasGarden: hasGarden == _unset ? this.hasGarden : hasGarden as bool?,
      hasSecurity: hasSecurity == _unset ? this.hasSecurity : hasSecurity as bool?,
    );
  }

  static const _unset = Object();

  int get activeAdvancedCount => [
        propertyType,
        minPrice,
        maxPrice,
        minBedrooms,
        minBathrooms,
        minArea,
        maxArea,
        isFurnished,
        hasGarage,
        hasPool,
        hasGarden,
        hasSecurity,
      ].where((e) => e != null && e != false).length;
}

class TenantInterest {
  final String id;
  final String tenantId;
  final String propertyId;
  final String message;
  final String status;
  final String createdAt;

  TenantInterest({
    required this.id,
    required this.tenantId,
    required this.propertyId,
    required this.message,
    required this.status,
    required this.createdAt,
  });

  factory TenantInterest.fromJson(Map<String, dynamic> json) => TenantInterest(
        id: json['id'] as String,
        tenantId: json['tenant_id'] as String? ?? '',
        propertyId: json['property_id'] as String? ?? '',
        message: json['message'] as String? ?? '',
        status: json['status'] as String? ?? 'pending',
        createdAt: json['created_at'] as String? ?? '',
      );
}

class AppMessage {
  final String id;
  final String conversationId;
  final String senderId;
  final String content;
  final bool isRead;
  final String createdAt;

  AppMessage({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.content,
    required this.isRead,
    required this.createdAt,
  });

  factory AppMessage.fromJson(Map<String, dynamic> json) => AppMessage(
        id: json['id'] as String,
        conversationId: json['conversation_id'] as String? ?? '',
        senderId: json['sender_id'] as String? ?? '',
        content: json['content'] as String? ?? '',
        isRead: json['is_read'] as bool? ?? false,
        createdAt: json['created_at'] as String? ?? '',
      );
}

class SubscriptionPlan {
  final String id;
  final String name;
  final String targetRole;
  final double priceCdf;
  final double priceUsd;
  final Map<String, dynamic> features;
  final bool isActive;

  SubscriptionPlan({
    required this.id,
    required this.name,
    required this.targetRole,
    required this.priceCdf,
    required this.priceUsd,
    required this.features,
    required this.isActive,
  });

  factory SubscriptionPlan.fromJson(Map<String, dynamic> json) => SubscriptionPlan(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
        targetRole: json['target_role'] as String? ?? 'tenant',
        priceCdf: (json['price_cdf'] as num?)?.toDouble() ?? 0,
        priceUsd: (json['price_usd'] as num?)?.toDouble() ?? 0,
        features: (json['features'] as Map?)?.cast<String, dynamic>() ?? {},
        isActive: json['is_active'] as bool? ?? true,
      );
}

class UserSubscription {
  final String id;
  final String userId;
  final String planId;
  final String status;
  final String? trialEndsAt;
  final String? expiresAt;
  final SubscriptionPlan? plan;

  UserSubscription({
    required this.id,
    required this.userId,
    required this.planId,
    required this.status,
    this.trialEndsAt,
    this.expiresAt,
    this.plan,
  });

  factory UserSubscription.fromJson(Map<String, dynamic> json) => UserSubscription(
        id: json['id'] as String,
        userId: json['user_id'] as String? ?? '',
        planId: json['plan_id'] as String? ?? '',
        status: json['status'] as String? ?? 'trial',
        trialEndsAt: json['trial_ends_at'] as String?,
        expiresAt: json['expires_at'] as String?,
        plan: json['plan'] != null ? SubscriptionPlan.fromJson(json['plan'] as Map<String, dynamic>) : null,
      );
}

class DailyUsage {
  final String userId;
  final String usageDate;
  final int searchCount;
  final int interestCount;

  DailyUsage({
    required this.userId,
    required this.usageDate,
    required this.searchCount,
    required this.interestCount,
  });

  factory DailyUsage.fromJson(Map<String, dynamic> json) => DailyUsage(
        userId: json['user_id'] as String? ?? '',
        usageDate: json['usage_date'] as String? ?? '',
        searchCount: json['search_count'] as int? ?? 0,
        interestCount: json['interest_count'] as int? ?? 0,
      );
}

class RoleConfig {
  final String role;
  final String label;
  final String labelFr;
  final String description;
  final bool isPro;
  final bool canPublish;
  final bool canSearch;
  final String? defaultListingType;
  final Color color;

  const RoleConfig({
    required this.role,
    required this.label,
    required this.labelFr,
    required this.description,
    required this.isPro,
    required this.canPublish,
    required this.canSearch,
    this.defaultListingType,
    required this.color,
  });
}

const Map<String, RoleConfig> roleConfigs = {
  'tenant': RoleConfig(
    role: 'tenant', label: 'Locataire', labelFr: 'Locataire / Chercheur',
    description: 'Je recherche un bien à louer', isPro: false, canPublish: false,
    canSearch: true, defaultListingType: 'rent', color: Color(0xFF0F3D68),
  ),
  'buyer': RoleConfig(
    role: 'buyer', label: 'Acheteur', labelFr: 'Acheteur',
    description: 'Je recherche un bien à acheter', isPro: false, canPublish: false,
    canSearch: true, defaultListingType: 'sale', color: Color(0xFF0D7490),
  ),
  'owner': RoleConfig(
    role: 'owner', label: 'Propriétaire', labelFr: 'Propriétaire',
    description: 'Je publie mes biens en location', isPro: false, canPublish: true,
    canSearch: false, defaultListingType: 'rent', color: Color(0xFFC9962B),
  ),
  'seller': RoleConfig(
    role: 'seller', label: 'Vendeur', labelFr: 'Vendeur',
    description: 'Je vends mes propres biens', isPro: false, canPublish: true,
    canSearch: false, defaultListingType: 'sale', color: Color(0xFFDC6B2F),
  ),
  'agent': RoleConfig(
    role: 'agent', label: 'Agent', labelFr: 'Courtier / Agent',
    description: 'Je gère des biens pour le compte de tiers', isPro: true, canPublish: true,
    canSearch: true, defaultListingType: null, color: Color(0xFF7C3AED),
  ),
  'promoter': RoleConfig(
    role: 'promoter', label: 'Promoteur', labelFr: 'Promoteur Immobilier',
    description: 'Je développe des projets multi-unités', isPro: true, canPublish: true,
    canSearch: false, defaultListingType: 'sale', color: Color(0xFF059669),
  ),
  'investor': RoleConfig(
    role: 'investor', label: 'Investisseur', labelFr: 'Investisseur',
    description: 'Je constitue un portefeuille immobilier', isPro: true, canPublish: false,
    canSearch: true, defaultListingType: null, color: Color(0xFFB45309),
  ),
  'admin': RoleConfig(
    role: 'admin', label: 'Admin', labelFr: 'Administrateur',
    description: 'Accès complet à la plateforme', isPro: true, canPublish: true,
    canSearch: true, defaultListingType: null, color: Color(0xFF374151),
  ),
};

bool isPublisherRole(String role) => ['owner', 'seller', 'agent', 'promoter', 'admin'].contains(role);
bool isSearcherRole(String role) => ['tenant', 'buyer', 'investor', 'agent', 'admin'].contains(role);
bool isProfessionalRole(String role) => ['agent', 'promoter', 'investor'].contains(role);
