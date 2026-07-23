import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_client.dart';
import '../models/models.dart';

class AuthState {
  final User? user;
  final Session? session;
  final Profile? profile;
  final bool loading;

  const AuthState({this.user, this.session, this.profile, this.loading = true});

  AuthState copyWith({User? user, Session? session, Profile? profile, bool? loading, bool clearUser = false}) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      session: clearUser ? null : (session ?? this.session),
      profile: clearUser ? null : (profile ?? this.profile),
      loading: loading ?? this.loading,
    );
  }
}

class AuthController extends StateNotifier<AuthState> {
  AuthController() : super(const AuthState()) {
    _init();
  }

  Future<void> _init() async {
    final session = supabase.auth.currentSession;
    state = state.copyWith(session: session, user: session?.user);
    if (session?.user != null) {
      await _fetchProfile(session!.user.id);
    }
    state = state.copyWith(loading: false);

    supabase.auth.onAuthStateChange.listen((data) async {
      final session = data.session;
      if (session?.user != null) {
        state = state.copyWith(session: session, user: session!.user, loading: false);
        await _fetchProfile(session.user.id);
      } else {
        state = state.copyWith(clearUser: true, loading: false);
      }
    });
  }

  Future<void> _fetchProfile(String userId) async {
    final data = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data != null) {
      state = state.copyWith(profile: Profile.fromJson(data));
    }
  }

  Future<String?> signIn(String email, String password) async {
    try {
      await supabase.auth.signInWithPassword(email: email, password: password);
      return null;
    } on AuthException catch (e) {
      return e.message;
    }
  }

  Future<String?> signUp(String email, String password, String displayName, String role) async {
    try {
      await supabase.auth.signUp(
        email: email,
        password: password,
        data: {'display_name': displayName, 'role': role},
      );
      return null;
    } on AuthException catch (e) {
      return e.message;
    }
  }

  Future<void> signOut() async {
    await supabase.auth.signOut();
  }

  Future<void> refreshProfile() async {
    if (state.user != null) await _fetchProfile(state.user!.id);
  }
}

final authProvider = StateNotifierProvider<AuthController, AuthState>((ref) => AuthController());
