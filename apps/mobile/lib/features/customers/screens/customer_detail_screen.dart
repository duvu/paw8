import 'package:dio/dio.dart' as dio_options;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/core/providers/providers.dart';
import 'package:mobile/features/customers/providers/customers_provider.dart';

final _customerDetailProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, id) async {
      final repo = ref.watch(customersRepositoryProvider);
      return repo.getCustomer(id);
    });

final _customerContractsProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, id) async {
      final repo = ref.watch(customersRepositoryProvider);
      return repo.getCustomerContracts(id);
    });

class CustomerDetailScreen extends ConsumerWidget {
  final String customerId;
  const CustomerDetailScreen({super.key, required this.customerId});

  Future<void> _uploadId(
    BuildContext context,
    WidgetRef ref,
    ImageSource source,
  ) async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: source);
    if (file == null) return;

    final client = ref.read(apiClientProvider);
    try {
      // Step 1: get presigned upload URL
      final urlResp = await client.dio.post(
        '/files/upload-url',
        data: {
          'entityType': 'customer',
          'entityId': customerId,
          'fileType': 'id',
          'filename': file.name,
          'mimeType': 'image/jpeg',
        },
      );
      final uploadUrl = urlResp.data['uploadUrl'] as String;
      final fileId = urlResp.data['fileId'] as String;

      // Step 2: PUT to presigned URL
      final bytes = await file.readAsBytes();
      await client.dio.put(
        uploadUrl,
        data: bytes,
        options: dio_options.Options(
          headers: {'Content-Type': 'image/jpeg'},
          sendTimeout: const Duration(seconds: 60),
        ),
      );

      // Step 3: confirm upload
      await client.dio.post('/files/confirm', data: {'fileId': fileId});

      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(
          const SnackBar(content: Text('ID uploaded successfully')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload failed: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context)!;
    final customerAsync = ref.watch(_customerDetailProvider(customerId));
    final contractsAsync = ref.watch(_customerContractsProvider(customerId));

    return Scaffold(
      appBar: AppBar(
        title: Text(l.customerDetailTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.note_add),
            onPressed: () => context.push('/customers/$customerId/notes'),
          ),
        ],
      ),
      body: customerAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (customer) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _InfoCard(customer: customer),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.camera_alt),
                    label: const Text('Upload ID (Camera)'),
                    onPressed: () =>
                        _uploadId(context, ref, ImageSource.camera),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.photo_library),
                    label: const Text('Upload ID (Gallery)'),
                    onPressed: () =>
                        _uploadId(context, ref, ImageSource.gallery),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'Contract History',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            contractsAsync.when(
              loading: () => const CircularProgressIndicator(),
              error: (e, _) => Text('Error: $e'),
              data: (data) {
                final contracts = data['data'] as List<dynamic>? ?? [];
                if (contracts.isEmpty) {
                  return Text(l.commonNoData);
                }
                return Column(
                  children: contracts.map((c) {
                    final contract = c as Map<String, dynamic>;
                    return ListTile(
                      title: Text(contract['contractCode'] as String? ?? ''),
                      subtitle: Text(contract['status'] as String? ?? ''),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () =>
                          context.push('/contracts/${contract['id']}'),
                    );
                  }).toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final Map<String, dynamic> customer;
  const _InfoCard({required this.customer});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              customer['fullName'] as String? ?? '',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Divider(),
            _InfoRow('Phone', customer['phone'] as String?),
            _InfoRow('Identity Number', customer['identityNumber'] as String?),
            _InfoRow('Date of Birth', customer['dateOfBirth'] as String?),
            _InfoRow('Occupation', customer['occupation'] as String?),
            _InfoRow('Address', customer['permanentAddress'] as String?),
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
            width: 130,
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
