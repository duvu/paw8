import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/features/contracts/providers/contracts_provider.dart';

final _upcomingDueProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
      final repo = ref.watch(contractsRepositoryProvider);
      return repo.getUpcomingDue();
    });

class UpcomingDueScreen extends ConsumerWidget {
  const UpcomingDueScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context)!;
    final async = ref.watch(_upcomingDueProvider);
    return Scaffold(
      appBar: AppBar(title: Text(l.upcomingDueTitle)),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (data) {
          final contracts = data['data'] as List<dynamic>? ?? [];
          if (contracts.isEmpty) {
            return Center(child: Text(l.commonNoData));
          }
          return ListView.builder(
            itemCount: contracts.length,
            itemBuilder: (context, i) {
              final c = contracts[i] as Map<String, dynamic>;
              final daysUntilDue = c['daysUntilDue'] as int?;
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: daysUntilDue != null && daysUntilDue <= 3
                      ? Colors.orange
                      : Colors.green,
                  child: Text('${daysUntilDue ?? '-'}'),
                ),
                title: Text(c['contractCode'] as String? ?? ''),
                subtitle: Text(
                  '${c['customer']?['fullName'] ?? ''} • Due: ${c['dueDate'] ?? '-'}',
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push('/contracts/${c['id']}'),
              );
            },
          );
        },
      ),
    );
  }
}
