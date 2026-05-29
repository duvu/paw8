import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:mobile/features/customers/providers/customers_provider.dart';

class CustomerNotesScreen extends ConsumerStatefulWidget {
  final String customerId;
  const CustomerNotesScreen({super.key, required this.customerId});

  @override
  ConsumerState<CustomerNotesScreen> createState() =>
      _CustomerNotesScreenState();
}

class _CustomerNotesScreenState extends ConsumerState<CustomerNotesScreen> {
  final _noteController = TextEditingController();
  bool _isSaving = false;

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _saveNote() async {
    final note = _noteController.text.trim();
    if (note.isEmpty) return;
    setState(() => _isSaving = true);
    try {
      final repo = ref.read(customersRepositoryProvider);
      await repo.patchCustomer(widget.customerId, {'notes': note});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Note saved')),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save note: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l.customerNotesTitle)),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _noteController,
              decoration: InputDecoration(
                labelText: l.customersNotes,
                border: const OutlineInputBorder(),
                hintText: 'Enter reminder or note for customer...',
              ),
              maxLines: 6,
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSaving ? null : _saveNote,
                child: _isSaving
                    ? const CircularProgressIndicator()
                    : Text(l.customerNotesAdd),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
