import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/api/api_client.dart';
import 'package:mobile/core/router/router.dart';
import 'package:mobile/core/providers/secure_storage_provider.dart';
import 'package:go_router/go_router.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return ApiClient(storage);
});

final routerProvider = Provider<GoRouter>((ref) {
  return createRouter(ref);
});
