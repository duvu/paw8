import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/core/api/api_client.dart';
import 'package:mobile/core/auth/session.dart';

class AuthSession {
  final String accessToken;
  final String refreshToken;
  final int expiresIn;

  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresIn,
  });
}

class AuthRepository {
  final ApiClient _client;
  final FlutterSecureStorage _storage;

  AuthRepository(this._client, this._storage);

  Future<AuthSession> login(String email, String password) async {
    final response = await _client.dio.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    final data = response.data as Map<String, dynamic>;
    final accessToken = data['accessToken'] as String?;
    final refreshToken = data['refreshToken'] as String?;
    final expiresIn = data['expiresIn'];

    if (accessToken == null || refreshToken == null || expiresIn is! int) {
      throw StateError('invalid_auth_response');
    }

    await _storage.write(key: accessTokenStorageKey, value: accessToken);
    await _storage.write(key: refreshTokenStorageKey, value: refreshToken);
    await _storage.write(
      key: expiresAtStorageKey,
      value: DateTime.now().add(Duration(seconds: expiresIn)).millisecondsSinceEpoch.toString(),
    );
    sessionRefreshNotifier.notifySessionChanged();

    return AuthSession(
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresIn: expiresIn,
    );
  }

  Future<Map<String, dynamic>?> getUserProfile(String userId) async {
    final response = await _client.dio.get('/users/$userId');
    return response.data as Map<String, dynamic>?;
  }

  Future<void> clearSession({bool notify = true}) async {
    await _storage.delete(key: accessTokenStorageKey);
    await _storage.delete(key: refreshTokenStorageKey);
    await _storage.delete(key: expiresAtStorageKey);
    if (notify) {
      sessionRefreshNotifier.notifySessionChanged();
    }
  }

  Future<void> logout() async {
    try {
      await _client.dio.post('/auth/logout');
    } on DioException {
      // Clear local state even if the server session is already invalid.
    } finally {
      await clearSession();
    }
  }

  Future<String?> getToken() => _storage.read(key: accessTokenStorageKey);
}
