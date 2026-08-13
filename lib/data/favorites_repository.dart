import '../core/supabase_client.dart';
import '../models/models.dart';
import 'properties_repository.dart';

class FavoritesRepository {
  Future<Set<String>> fetchFavoriteIds(String userId) async {
    final data = await supabase.from('favorites').select('property_id').eq('user_id', userId);
    return (data as List).map((e) => e['property_id'] as String).toSet();
  }

  Future<List<Property>> fetchFavoriteProperties(String userId) async {
    final data = await supabase
        .from('favorites')
        .select('property_id, property:properties($propertySelectWithRelations)')
        .eq('user_id', userId)
        .order('created_at', ascending: false);
    return (data as List)
        .where((e) => e['property'] != null)
        .map((e) => Property.fromJson(e['property']))
        .toList();
  }

  Future<void> addFavorite(String userId, String propertyId) async {
    await supabase.from('favorites').insert({'user_id': userId, 'property_id': propertyId});
  }

  Future<void> removeFavorite(String userId, String propertyId) async {
    await supabase.from('favorites').delete().eq('user_id', userId).eq('property_id', propertyId);
  }
}

final favoritesRepository = FavoritesRepository();
