import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/features/contracts/providers/contracts_provider.dart';

final _contractDetailProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, id) async {
      final repo = ref.watch(contractsRepositoryProvider);
      return repo.getContract(id);
    });

final _contractTransactionsProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, id) async {
      final repo = ref.watch(contractsRepositoryProvider);
      return repo.getContractTransactions(id);
    });

class ContractDetailScreen extends ConsumerWidget {
  final String contractId;
  const ContractDetailScreen({super.key, required this.contractId});

  void _showActionDialog(BuildContext context, String action) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(action),
        content: Text(
          '$action for contract $contractId — navigate to dedicated screen.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context)!;
    final contractAsync = ref.watch(_contractDetailProvider(contractId));
    final transactionsAsync = ref.watch(
      _contractTransactionsProvider(contractId),
    );

    return Scaffold(
      appBar: AppBar(title: Text(l.contractDetailTitle)),
      body: contractAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (contract) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _ContractInfoCard(contract: contract, l: l),
            const SizedBox(height: 12),
            if (contract['customer'] != null)
              ListTile(
                leading: const Icon(Icons.person),
                title: Text(
                  contract['customer']['fullName'] as String? ?? '',
                ),
                subtitle: const Text('View customer'),
                onTap: () => context.push(
                  '/customers/${contract['customer']['id']}',
                ),
              ),
            const SizedBox(height: 12),
            const Text(
              'Transaction History',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            transactionsAsync.when(
              loading: () => const CircularProgressIndicator(),
              error: (e, _) => Text('Error: $e'),
              data: (data) {
                final txns = data['data'] as List<dynamic>? ?? [];
                if (txns.isEmpty) return Text(l.commonNoData);
                return Column(
                  children: txns.map((t) {
                    final tx = t as Map<String, dynamic>;
                    return ListTile(
                      title: Text(tx['transactionType'] as String? ?? ''),
                      subtitle: Text(tx['transactionDate'] as String? ?? ''),
                      trailing: Text(
                        '${tx['amount'] ?? '-'}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    );
                  }).toList(),
                );
              },
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () =>
                        _showActionDialog(context, 'Collect Interest'),
                    child: const Text('Collect Interest'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _showActionDialog(context, 'Extend'),
                    child: const Text('Extend'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _showActionDialog(context, 'Settle'),
                    child: const Text('Settle'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ContractInfoCard extends StatelessWidget {
  final Map<String, dynamic> contract;
  final AppLocalizations l;
  const _ContractInfoCard({required this.contract, required this.l});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              contract['contractCode'] as String? ?? '',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Divider(),
            _InfoRow(l.contractStatus, contract['status'] as String?),
            _InfoRow(
              l.contractAmount,
              '${contract['principalAmount'] ?? '-'}',
            ),
            _InfoRow(
              l.contractInterestRate,
              '${contract['interestRate'] ?? '-'}',
            ),
            _InfoRow(l.contractStartDate, contract['startDate'] as String?),
            _InfoRow(l.contractDueDate, contract['dueDate'] as String?),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String? value;
  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(child: Text(value ?? '-')),
        ],
      ),
    );
  }
}
