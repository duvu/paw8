import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/features/contracts/providers/contracts_provider.dart';

final _overdueProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final repo = ref.watch(contractsRepositoryProvider);
  return repo.getOverdue();
});

class OverdueScreen extends ConsumerWidget {
  const OverdueScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context)!;
    final async = ref.watch(_overdueProvider);
    return Scaffold(
      appBar: AppBar(title: Text(l.overdueTitle)),
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
              final daysOverdue = c['daysOverdue'] as int?;
              final interest = c['accruedInterest'];
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: Colors.red,
                  child: Text(
                    '${daysOverdue ?? '-'}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                    ),
                  ),
                ),
                title: Text(c['contractCode'] as String? ?? ''),
                subtitle: Text(
                  '${c['customer']?['fullName'] ?? ''} • ${daysOverdue != null ? l.commonDaysOverdue(daysOverdue) : '-'} • Interest: ${interest ?? '-'}',
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
