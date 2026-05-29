import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/features/customers/providers/customers_provider.dart';

class CustomersScreen extends ConsumerStatefulWidget {
  const CustomersScreen({super.key});

  @override
  ConsumerState<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends ConsumerState<CustomersScreen> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final state = ref.watch(customersProvider);
    return Scaffold(
      appBar: AppBar(title: Text(l.customersTitle)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: l.customersSearch,
                prefixIcon: const Icon(Icons.search),
                border: const OutlineInputBorder(),
              ),
              onChanged: (q) =>
                  ref.read(customersProvider.notifier).search(q),
            ),
          ),
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : state.error != null
                ? Center(child: Text(state.error!))
                : state.customers.isEmpty
                ? Center(child: Text(l.commonNoData))
                : ListView.builder(
                    itemCount: state.customers.length,
                    itemBuilder: (context, i) {
                      final c = state.customers[i] as Map<String, dynamic>;
                      return ListTile(
                        leading: const CircleAvatar(
                          child: Icon(Icons.person),
                        ),
                        title: Text(c['fullName'] as String? ?? ''),
                        subtitle: Text(c['phone'] as String? ?? ''),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/customers/${c['id']}'),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
