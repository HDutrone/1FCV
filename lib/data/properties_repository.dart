import '../core/supabase_client.dart';
import '../models/models.dart';

const propertySelectWithRelations = '''
  *,
  city:cities(id, name),
  commune:communes(id, name),
  property_images(id, url, is_primary, order_index)
''';

class PropertiesRepository {
  Future<List<Property>> fetchProperties(PropertyFilters filters, {String? query}) async {
    var q = supabase
        .from('properties')
        .select(propertySelectWithRelations)
        .eq('listing_type', filters.listingType)
        .inFilter('status', ['approved', 'active']);

    if (filters.cityId != null) q = q.eq('city_id', filters.cityId!);
    if (filters.communeId != null) q = q.eq('commune_id', filters.communeId!);
    if (filters.minPrice != null) q = q.gte('price', filters.minPrice!);
    if (filters.maxPrice != null) q = q.lte('price', filters.maxPrice!);
    if (filters.propertyType != null) q = q.eq('property_type', filters.propertyType!);
    if (filters.minBedrooms != null) q = q.gte('bedrooms', filters.minBedrooms!);
    if (filters.minBathrooms != null) q = q.gte('bathrooms', filters.minBathrooms!);
    if (filters.minArea != null) q = q.gte('surface_area', filters.minArea!);
    if (filters.maxArea != null) q = q.lte('surface_area', filters.maxArea!);
    if (filters.isFurnished == true) q = q.eq('is_furnished', true);
    if (filters.hasGarage == true) q = q.eq('has_garage', true);
    if (filters.hasPool == true) q = q.eq('has_pool', true);
    if (filters.hasGarden == true) q = q.eq('has_garden', true);
    if (filters.hasSecurity == true) q = q.eq('has_security', true);

    if (query != null && query.trim().isNotEmpty) {
      final term = query.trim();
      q = q.or('title.ilike.%$term%,description.ilike.%$term%,address_hint.ilike.%$term%');
    }

    final data = await q.order('created_at', ascending: false);
    return (data as List).map((e) => Property.fromJson(e)).toList();
  }

  Future<Property?> fetchPropertyById(String id) async {
    final data = await supabase
        .from('properties')
        .select('$propertySelectWithRelations, owner_criteria(*)')
        .eq('id', id)
        .maybeSingle();
    return data != null ? Property.fromJson(data) : null;
  }

  Future<void> incrementViews(String id, int current) async {
    await supabase.from('properties').update({'views_count': current + 1}).eq('id', id);
  }

  Future<List<Property>> fetchSimilar(Property property) async {
    var data = await supabase
        .from('properties')
        .select(propertySelectWithRelations)
        .eq('listing_type', property.listingType)
        .eq('city_id', property.cityId ?? '')
        .inFilter('status', ['approved', 'active'])
        .neq('id', property.id)
        .limit(6);

    if ((data as List).isEmpty) {
      data = await supabase
          .from('properties')
          .select(propertySelectWithRelations)
          .eq('listing_type', property.listingType)
          .inFilter('status', ['approved', 'active'])
          .neq('id', property.id)
          .limit(4);
    }
    return (data).map((e) => Property.fromJson(e)).toList();
  }

  Future<List<Property>> fetchOwnerListings(String ownerId) async {
    final data = await supabase
        .from('properties')
        .select('$propertySelectWithRelations, tenant_interests(id)')
        .eq('owner_id', ownerId)
        .order('created_at', ascending: false);
    return (data as List).map((e) => Property.fromJson(e)).toList();
  }

  Future<Map<String, dynamic>> createProperty(Map<String, dynamic> payload) async {
    return await supabase.from('properties').insert(payload).select().single();
  }
}

final propertiesRepository = PropertiesRepository();
