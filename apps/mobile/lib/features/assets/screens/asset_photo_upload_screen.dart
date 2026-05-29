import 'package:dio/dio.dart' as dio_options;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/core/providers/providers.dart';

class AssetPhotoUploadScreen extends ConsumerStatefulWidget {
  final String assetId;
  const AssetPhotoUploadScreen({super.key, required this.assetId});

  @override
  ConsumerState<AssetPhotoUploadScreen> createState() =>
      _AssetPhotoUploadScreenState();
}

class _AssetPhotoUploadScreenState
    extends ConsumerState<AssetPhotoUploadScreen> {
  XFile? _selectedFile;
  bool _isUploading = false;
  bool _uploadDone = false;

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.camera);
    if (file != null) {
      setState(() {
        _selectedFile = file;
        _uploadDone = false;
      });
    }
  }

  Future<void> _confirmUpload() async {
    if (_selectedFile == null) return;
    setState(() => _isUploading = true);
    final client = ref.read(apiClientProvider);
    try {
      // Step 1: get presigned upload URL
      final urlResp = await client.dio.post(
        '/files/upload-url',
        data: {
          'entityType': 'asset',
          'entityId': widget.assetId,
          'fileType': 'photo',
          'filename': _selectedFile!.name,
          'mimeType': 'image/jpeg',
        },
      );
      final uploadUrl = urlResp.data['uploadUrl'] as String;
      final fileId = urlResp.data['fileId'] as String;

      // Step 2: PUT to presigned URL
      final bytes = await _selectedFile!.readAsBytes();
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

      setState(() {
        _isUploading = false;
        _uploadDone = true;
      });
    } catch (e) {
      setState(() => _isUploading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload failed: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l.assetPhotoUploadTitle)),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            if (_selectedFile == null)
              Expanded(
                child: Center(
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.camera_alt),
                    label: Text(l.assetUploadPhoto),
                    onPressed: _pickPhoto,
                  ),
                ),
              )
            else ...[
              Expanded(
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    FutureBuilder<String>(
                      future: _selectedFile!.path.isNotEmpty
                          ? Future.value(_selectedFile!.path)
                          : Future.value(''),
                      builder: (ctx, snap) {
                        if (snap.data?.isNotEmpty == true) {
                          return Image.network(
                            snap.data!,
                            fit: BoxFit.contain,
                            errorBuilder: (_, __, ___) => const Icon(
                              Icons.broken_image,
                              size: 80,
                            ),
                          );
                        }
                        return const Icon(Icons.image, size: 80);
                      },
                    ),
                    if (_uploadDone)
                      const Icon(
                        Icons.check_circle,
                        color: Colors.green,
                        size: 60,
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isUploading ? null : _pickPhoto,
                      child: Text(l.assetUploadPhoto),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed:
                          _isUploading || _uploadDone ? null : _confirmUpload,
                      child: _isUploading
                          ? const CircularProgressIndicator()
                          : Text(_uploadDone ? l.commonSuccess : l.assetUploadButton),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
