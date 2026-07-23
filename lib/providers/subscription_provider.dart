import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/supabase_client.dart';
import '../models/models.dart';
import 'auth_provider.dart';

class SubscriptionState {
  final List<SubscriptionPlan> plans;
  final UserSubscription? currentSubscription;
  final SubscriptionPlan? currentPlan;
  final DailyUsage? dailyUsage;
  final bool loading;

  const SubscriptionState({
    this.plans = const [],
    this.currentSubscription,
    this.currentPlan,
    this.dailyUsage,
    this.loading = true,
  });

  bool get isPremium =>
      currentPlan != null &&
      currentPlan!.priceCdf > 0 &&
      currentSubscription != null &&
      ['active', 'trial'].contains(currentSubscription!.status);

  bool get isTrialActive {
    if (currentSubscription?.status != 'trial') return false;
    final trialEnds = currentSubscription?.trialEndsAt;
    if (trialEnds == null) return false;
    return DateTime.parse(trialEnds).isAfter(DateTime.now());
  }

  SubscriptionState copyWith({
    List<SubscriptionPlan>? plans,
    UserSubscription? currentSubscription,
    SubscriptionPlan? currentPlan,
    DailyUsage? dailyUsage,
    bool? loading,
    bool clearSubscription = false,
  }) {
    return SubscriptionState(
      plans: plans ?? this.plans,
      currentSubscription: clearSubscription ? null : (currentSubscription ?? this.currentSubscription),
      currentPlan: clearSubscription ? null : (currentPlan ?? this.currentPlan),
      dailyUsage: dailyUsage ?? this.dailyUsage,
      loading: loading ?? this.loading,
    );
  }
}

class SubscriptionController extends StateNotifier<SubscriptionState> {
  final Ref ref;

  SubscriptionController(this.ref) : super(const SubscriptionState()) {
    _load();
    ref.listen(authProvider, (previous, next) {
      if (previous?.user?.id != next.user?.id) _load();
    });
  }

  Future<void> _load() async {
    state = state.copyWith(loading: true);
    await Future.wait([_fetchPlans(), _fetchSubscription(), _fetchDailyUsage()]);
    state = state.copyWith(loading: false);
  }

  Future<void> _fetchPlans() async {
    final data = await supabase.from('subscription_plans').select('*').eq('is_active', true).order('price_cdf');
    state = state.copyWith(plans: (data as List).map((e) => SubscriptionPlan.fromJson(e)).toList());
  }

  Future<void> _fetchSubscription() async {
    final userId = ref.read(authProvider).user?.id;
    if (userId == null) {
      state = state.copyWith(clearSubscription: true);
      return;
    }
    final data = await supabase
        .from('user_subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('user_id', userId)
        .inFilter('status', ['active', 'trial'])
        .order('created_at', ascending: false)
        .limit(1)
        .maybeSingle();

    if (data != null) {
      final sub = UserSubscription.fromJson(data);
      state = state.copyWith(currentSubscription: sub, currentPlan: sub.plan);
    } else {
      state = state.copyWith(clearSubscription: true);
    }
  }

  Future<void> _fetchDailyUsage() async {
    final userId = ref.read(authProvider).user?.id;
    if (userId == null) return;
    final today = DateTime.now().toIso8601String().split('T').first;
    final data = await supabase
        .from('daily_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('usage_date', today)
        .maybeSingle();
    if (data != null) state = state.copyWith(dailyUsage: DailyUsage.fromJson(data));
  }

  dynamic getFeature(String key) {
    final role = ref.read(authProvider).profile?.role ?? 'tenant';
    if (state.currentPlan == null) {
      final freePlan = state.plans.where((p) => p.targetRole == role && p.priceCdf == 0);
      return freePlan.isNotEmpty ? freePlan.first.features[key] : null;
    }
    return state.currentPlan!.features[key];
  }

  bool canSearch() {
    if (state.isPremium) return true;
    final limit = getFeature('searches_per_day');
    if (limit == -1) return true;
    return (state.dailyUsage?.searchCount ?? 0) < (limit ?? 5);
  }

  Future<bool> canPublishListing() async {
    final userId = ref.read(authProvider).user?.id;
    if (userId == null) return false;
    if (state.isPremium) return true;
    final limit = getFeature('max_listings');
    if (limit == -1) return true;
    final count = await supabase.from('properties').select('id').eq('owner_id', userId).count();
    return count.count < (limit ?? 1);
  }

  Future<void> refresh() async {
    await Future.wait([_fetchSubscription(), _fetchDailyUsage()]);
  }
}

final subscriptionProvider =
    StateNotifierProvider<SubscriptionController, SubscriptionState>((ref) => SubscriptionController(ref));
