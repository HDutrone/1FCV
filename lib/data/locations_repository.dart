import '../core/supabase_client.dart';
import '../models/models.dart';

class LocationsRepository {
  Future<List<City>> fetchCities() async {
    final data = await supabase.from('cities').select('*').order('name');
    return (data as List).map((e) => City.fromJson(e)).toList();
  }

  Future<List<Commune>> fetchCommunes(String cityId) async {
    final data = await supabase.from('communes').select('*').eq('city_id', cityId).order('name');
    return (data as List).map((e) => Commune.fromJson(e)).toList();
  }
}

final locationsRepository = LocationsRepository();
