import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/core/auth/session.dart';

class ApiClient {
  static const baseUrl = 'http://localhost:3000/api/v1';
  late final Dio dio;
  final FlutterSecureStorage _storage;

  ApiClient(this._storage) {
    dio = Dio(BaseOptions(baseUrl: baseUrl));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (opts, handler) async {
          final token = await _storage.read(key: accessTokenStorageKey);
          if (token != null) {
            opts.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(opts);
        },
        onError: (err, handler) async {
          if (err.response?.statusCode == 401) {
            await _storage.delete(key: accessTokenStorageKey);
            await _storage.delete(key: refreshTokenStorageKey);
            await _storage.delete(key: expiresAtStorageKey);
            sessionRefreshNotifier.notifySessionChanged();
          }
          handler.next(err);
        },
      ),
    );
  }
}
