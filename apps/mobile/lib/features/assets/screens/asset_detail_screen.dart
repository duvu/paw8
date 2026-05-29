import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:mobile/core/providers/providers.dart';

final _assetDetailProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, id) async {
      final client = ref.watch(apiClientProvider);
      final response = await client.dio.get('/assets/$id');
      return response.data as Map<String, dynamic>;
    });

class AssetDetailScreen extends ConsumerWidget {
  final String assetId;
  const AssetDetailScreen({super.key, required this.assetId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context)!;
    final async = ref.watch(_assetDetailProvider(assetId));
    return Scaffold(
      appBar: AppBar(title: Text(l.assetDetailTitle)),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (asset) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      asset['assetName'] as String? ?? '',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Divider(),
                    _InfoRow('Type', asset['assetType'] as String?),
                    _InfoRow('Brand', asset['brand'] as String?),
                    _InfoRow('Model', asset['model'] as String?),
                    _InfoRow('Color', asset['color'] as String?),
                    _InfoRow('Serial', asset['serialNumber'] as String?),
                    _InfoRow('IMEI', asset['imei'] as String?),
                    _InfoRow(
                      'License Plate',
                      asset['licensePlate'] as String?,
                    ),
                    _InfoRow(l.contractStatus, asset['status'] as String?),
                    _InfoRow(
                      'Valuation',
                      '${asset['valuationAmount'] ?? '-'}',
                    ),
                    _InfoRow(
                      'Condition',
                      asset['conditionDescription'] as String?,
                    ),
                  ],
                ),
              ),
            ),
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
