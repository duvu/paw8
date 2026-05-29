import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/providers/providers.dart';
import 'package:mobile/features/auth/providers/auth_provider.dart';

final dashboardProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final client = ref.watch(apiClientProvider);
  final response = await client.dio.get('/reports/dashboard');
  final data = response.data as Map<String, dynamic>;

  const expectedKeys = [
    'activeContracts',
    'totalOutstandingPrincipal',
    'collectedToday',
    'collectedThisMonth',
    'upcomingDueCount',
    'overdueCount',
    'assetsInCustody',
  ];

  final isValid = expectedKeys.every((key) => data[key] is num);
  if (!isValid) {
    throw StateError('invalid_dashboard_response');
  }

  return data;
});

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int _selectedIndex = 0;

  Future<void> _handleLogout() async {
    await ref.read(authProvider.notifier).logout();
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final authState = ref.watch(authProvider);
    final dashboardAsync = ref.watch(dashboardProvider);
    final user = authState.user;

    final navItems = [
      _NavItem(icon: Icons.description_outlined, label: l.homeContracts, route: '/contracts'),
      _NavItem(icon: Icons.people_alt_outlined, label: l.homeCustomers, route: '/customers'),
      _NavItem(icon: Icons.schedule_outlined, label: l.homeUpcomingDue, route: '/contracts/upcoming'),
      _NavItem(icon: Icons.person_outline_rounded, label: l.homeProfile, route: null),
    ];

    return Scaffold(
      appBar: AppBar(
        toolbarHeight: 76,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(user?.displayName ?? l.homeWelcome),
            const SizedBox(height: 2),
            Text(
              _roleLabel(l, user?.role),
              style: TextStyle(
                fontSize: 12,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/settings'),
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: _selectedIndex == 3
          ? _buildProfile(context, authState, l)
          : _buildDashboard(context, dashboardAsync, l),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) {
          if (index < 3 && navItems[index].route != null) {
            if (index == 0) {
              setState(() => _selectedIndex = index);
            } else {
              context.push(navItems[index].route!);
            }
            return;
          }

          setState(() => _selectedIndex = index);
        },
        destinations: navItems
            .map(
              (item) => NavigationDestination(
                icon: Icon(item.icon),
                label: item.label,
              ),
            )
            .toList(),
      ),
    );
  }

  Widget _buildDashboard(
    BuildContext context,
    AsyncValue<Map<String, dynamic>> dashboardAsync,
    AppLocalizations l,
  ) {
    return dashboardAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.error_outline_rounded,
                size: 40,
                color: Theme.of(context).colorScheme.error,
              ),
              const SizedBox(height: 12),
              Text(
                error.toString().contains('invalid_dashboard_response')
                    ? l.homeDashboardInvalid
                    : l.homeDashboardError,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => ref.invalidate(dashboardProvider),
                child: Text(l.commonRetry),
              ),
            ],
          ),
        ),
      ),
      data: (data) {
        final cards = [
          _DashboardCardData(
            label: l.homeContracts,
            value: _formatNumber(data['activeContracts']),
            icon: Icons.description_outlined,
          ),
          _DashboardCardData(
            label: l.homeTotalOutstanding,
            value: _formatNumber(data['totalOutstandingPrincipal']),
            icon: Icons.account_balance_wallet_outlined,
          ),
          _DashboardCardData(
            label: l.homeUpcomingDue,
            value: _formatNumber(data['upcomingDueCount']),
            icon: Icons.schedule_outlined,
          ),
          _DashboardCardData(
            label: l.homeOverdue,
            value: _formatNumber(data['overdueCount']),
            icon: Icons.warning_amber_rounded,
          ),
          _DashboardCardData(
            label: l.homeAssets,
            value: _formatNumber(data['assetsInCustody']),
            icon: Icons.inventory_2_outlined,
          ),
          _DashboardCardData(
            label: l.homeCollectedToday,
            value: _formatNumber(data['collectedToday']),
            icon: Icons.payments_outlined,
          ),
        ];

        return ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(28),
                gradient: LinearGradient(
                  colors: [
                    Theme.of(context).colorScheme.primary,
                    Theme.of(context).colorScheme.primaryContainer,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l.homeOverviewBadge,
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: Theme.of(context).colorScheme.onPrimary,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    l.homeSecureWorkspace,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          color: Theme.of(context).colorScheme.onPrimary,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l.homeOverviewDescription,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(context).colorScheme.onPrimary.withValues(alpha: 0.9),
                          height: 1.5,
                        ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 1.02,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: cards.length,
              itemBuilder: (context, index) => _StatCard(data: cards[index]),
            ),
          ],
        );
      },
    );
  }

  Widget _buildProfile(
    BuildContext context,
    AuthState authState,
    AppLocalizations l,
  ) {
    final user = authState.user;

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 32,
                      backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                      child: Icon(
                        Icons.person_rounded,
                        color: Theme.of(context).colorScheme.primary,
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.displayName ?? l.homeProfileUnavailable,
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _roleLabel(l, user?.role),
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                _ProfileRow(
                  label: l.homeProfileEmail,
                  value: user?.email ?? l.homeProfileUnavailable,
                ),
                _ProfileRow(
                  label: l.homeProfileStores,
                  value: '${user?.allowedStoreIds.length ?? 0}',
                ),
                if (user?.tenantId != null)
                  _ProfileRow(
                    label: l.homeProfileTenant,
                    value: user!.tenantId!,
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.settings_outlined),
                title: Text(l.settingsTitle),
                subtitle: Text(l.homeSettingsDescription),
                onTap: () => context.push('/settings'),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.logout_rounded),
                title: Text(l.logout),
                subtitle: Text(l.homeLogoutDescription),
                onTap: _handleLogout,
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _formatNumber(Object? value) {
    if (value is num) {
      return value.toStringAsFixed(value % 1 == 0 ? 0 : 2);
    }
    return '—';
  }

  String _roleLabel(AppLocalizations l, String? role) {
    switch (role) {
      case 'platform_admin':
        return l.homeRolePlatformAdmin;
      case 'tenant_owner':
        return l.homeRoleTenantOwner;
      case 'tenant_admin':
        return l.homeRoleTenantAdmin;
      case 'store_manager':
        return l.homeRoleStoreManager;
      case 'staff':
        return l.homeRoleStaff;
      case 'accountant':
        return l.homeRoleAccountant;
      default:
        return l.homeRoleUnknown;
    }
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  final String? route;

  const _NavItem({required this.icon, required this.label, required this.route});
}

class _DashboardCardData {
  final String label;
  final String value;
  final IconData icon;

  const _DashboardCardData({
    required this.label,
    required this.value,
    required this.icon,
  });
}

class _StatCard extends StatelessWidget {
  final _DashboardCardData data;

  const _StatCard({required this.data});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                data.icon,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            const Spacer(),
            Text(
              data.value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 6),
            Text(
              data.label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileRow extends StatelessWidget {
  final String label;
  final String value;

  const _ProfileRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
          const SizedBox(height: 4),
          Text(value, style: Theme.of(context).textTheme.bodyLarge),
        ],
      ),
    );
  }
}
