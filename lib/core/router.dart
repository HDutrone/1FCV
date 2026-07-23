import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';
import '../screens/hero/mode_selection_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/home/listings_screen.dart';
import '../screens/favorites/favorites_screen.dart';
import '../screens/publish/publish_screen.dart';
import '../screens/publish/my_listings_screen.dart';
import '../screens/publish/my_requests_screen.dart';
import '../screens/publish/property_interests_screen.dart';
import '../screens/messages/messages_screen.dart';
import '../screens/messages/conversation_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/profile/edit_profile_screen.dart';
import '../screens/subscription/subscription_screen.dart';
import '../screens/property/property_detail_screen.dart';
import '../screens/admin/admin_dashboard_screen.dart';
import '../screens/misc/main_shell.dart';
import '../screens/misc/not_found_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    errorBuilder: (context, state) => const NotFoundScreen(),
    routes: [
      GoRoute(path: '/', builder: (context, state) => const ModeSelectionScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterScreen()),
      GoRoute(
        path: '/property/:id',
        builder: (context, state) => PropertyDetailScreen(propertyId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/conversation/:id',
        builder: (context, state) => ConversationScreen(conversationId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/subscription', builder: (context, state) => const SubscriptionScreen()),
      GoRoute(path: '/edit-profile', builder: (context, state) => const EditProfileScreen()),
      GoRoute(path: '/my-listings', builder: (context, state) => const MyListingsScreen()),
      GoRoute(path: '/my-requests', builder: (context, state) => const MyRequestsScreen()),
      GoRoute(
        path: '/property-interests',
        builder: (context, state) => PropertyInterestsScreen(
          propertyId: state.uri.queryParameters['propertyId'] ?? '',
          propertyTitle: state.uri.queryParameters['propertyTitle'] ?? '',
        ),
      ),
      GoRoute(path: '/admin', builder: (context, state) => const AdminDashboardScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => MainShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/home', builder: (context, state) => const ListingsScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/home/favorites', builder: (context, state) => const FavoritesScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/home/publish', builder: (context, state) => const PublishScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/home/messages', builder: (context, state) => const MessagesScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/home/profile', builder: (context, state) => const ProfileScreen()),
          ]),
        ],
      ),
    ],
    redirect: (context, state) {
      final auth = ref.read(authProvider);
      final loggingIn = state.matchedLocation == '/login' || state.matchedLocation == '/register';
      final atHero = state.matchedLocation == '/';

      if (!auth.loading && auth.user != null && atHero) return '/home';
      if (!auth.loading && auth.user == null && !atHero && !loggingIn && state.matchedLocation.startsWith('/home')) {
        return null;
      }
      return null;
    },
  );
});
