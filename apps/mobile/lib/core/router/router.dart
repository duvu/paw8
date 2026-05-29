import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/auth/session.dart';
import 'package:mobile/core/providers/secure_storage_provider.dart';
import 'package:mobile/features/auth/screens/login_screen.dart';
import 'package:mobile/features/home/screens/home_screen.dart';
import 'package:mobile/features/customers/screens/customers_screen.dart';
import 'package:mobile/features/customers/screens/customer_detail_screen.dart';
import 'package:mobile/features/customers/screens/customer_notes_screen.dart';
import 'package:mobile/features/contracts/screens/contracts_screen.dart';
import 'package:mobile/features/contracts/screens/contract_detail_screen.dart';
import 'package:mobile/features/contracts/screens/upcoming_due_screen.dart';
import 'package:mobile/features/contracts/screens/overdue_screen.dart';
import 'package:mobile/features/assets/screens/asset_detail_screen.dart';
import 'package:mobile/features/settings/screens/settings_screen.dart';

GoRouter createRouter(Ref ref) {
  final storage = ref.read(secureStorageProvider);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: sessionRefreshNotifier,
    redirect: (context, state) async {
      final token = await storage.read(key: accessTokenStorageKey);
      final isLoginPage = state.matchedLocation == '/login';
      if (token == null && !isLoginPage) return '/login';
      if (token != null && isLoginPage) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
      GoRoute(
        path: '/customers',
        builder: (context, state) => const CustomersScreen(),
      ),
      GoRoute(
        path: '/customers/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return CustomerDetailScreen(customerId: id);
        },
      ),
      GoRoute(
        path: '/contracts',
        builder: (context, state) => const ContractsScreen(),
      ),
      GoRoute(
        path: '/contracts/upcoming',
        builder: (context, state) => const UpcomingDueScreen(),
      ),
      GoRoute(
        path: '/contracts/overdue',
        builder: (context, state) => const OverdueScreen(),
      ),
      GoRoute(
        path: '/contracts/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return ContractDetailScreen(contractId: id);
        },
      ),
      GoRoute(
        path: '/assets/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return AssetDetailScreen(assetId: id);
        },
      ),
      GoRoute(
        path: '/customers/:id/notes',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return CustomerNotesScreen(customerId: id);
        },
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
    ],
  );
}
