import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/features/contracts/providers/contracts_provider.dart';

const _statuses = ['ALL', 'ACTIVE', 'NEAR_DUE', 'OVERDUE', 'SETTLED'];

class ContractsScreen extends ConsumerStatefulWidget {
  const ContractsScreen({super.key});

  @override
  ConsumerState<ContractsScreen> createState() => _ContractsScreenState();
}

class _ContractsScreenState extends ConsumerState<ContractsScreen> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final state = ref.watch(contractsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(l.contractsTitle)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: l.contractsSearch,
                prefixIcon: const Icon(Icons.search),
                border: const OutlineInputBorder(),
              ),
              onChanged: (q) =>
                  ref.read(contractsProvider.notifier).load(query: q),
            ),
          ),
          SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: _statuses.map((s) {
                final selected = state.statusFilter == s;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(s),
                    selected: selected,
                    onSelected: (_) => ref
                        .read(contractsProvider.notifier)
                        .load(status: s),
                  ),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : state.error != null
                ? Center(child: Text(state.error!))
                : state.contracts.isEmpty
                ? Center(child: Text(l.commonNoData))
                : ListView.builder(
                    itemCount: state.contracts.length,
                    itemBuilder: (context, i) {
                      final c =
                          state.contracts[i] as Map<String, dynamic>;
                      return ListTile(
                        title: Text(
                          c['contractCode'] as String? ?? '',
                        ),
                        subtitle: Text(
                          '${c['customer']?['fullName'] ?? ''} • ${c['status'] ?? ''}',
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/contracts/${c['id']}'),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
