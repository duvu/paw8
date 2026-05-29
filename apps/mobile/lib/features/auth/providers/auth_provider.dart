import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/auth/session.dart';
import 'package:mobile/core/providers/providers.dart';
import 'package:mobile/core/providers/secure_storage_provider.dart';
import 'package:mobile/features/auth/data/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  final storage = ref.watch(secureStorageProvider);
  return AuthRepository(client, storage);
});

class AuthState {
  final bool isAuthenticated;
  final AuthUser? user;
  final bool isLoading;
  final bool isReady;
  final String? error;

  const AuthState({
    this.isAuthenticated = false,
    this.user,
    this.isLoading = false,
    this.isReady = false,
    this.error,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    AuthUser? user,
    bool userSet = false,
    bool? isLoading,
    bool? isReady,
    String? error,
    bool errorSet = false,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: userSet ? user : this.user,
      isLoading: isLoading ?? this.isLoading,
      isReady: isReady ?? this.isReady,
      error: errorSet ? error : this.error,
    );
  }
}

class AuthUser {
  final String id;
  final String role;
  final String? tenantId;
  final List<String> allowedStoreIds;
  final String? email;
  final String? fullName;

  const AuthUser({
    required this.id,
    required this.role,
    required this.tenantId,
    required this.allowedStoreIds,
    required this.email,
    required this.fullName,
  });

  String get displayName {
    if (fullName != null && fullName!.trim().isNotEmpty) return fullName!;
    if (email != null && email!.trim().isNotEmpty) return email!;
    return id;
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repo;

  AuthNotifier(this._repo) : super(const AuthState(isLoading: true)) {
    sessionRefreshNotifier.addListener(_handleSessionRefresh);
    _hydrate();
  }

  @override
  void dispose() {
    sessionRefreshNotifier.removeListener(_handleSessionRefresh);
    super.dispose();
  }

  void _handleSessionRefresh() {
    Future<void>(() => _syncFromStorage(showLoader: false));
  }

  Future<void> _hydrate() async {
    await _syncFromStorage();
  }

  Future<void> _syncFromStorage({bool showLoader = true}) async {
    if (showLoader) {
      state = state.copyWith(isLoading: true, error: null, errorSet: true);
    }

    final token = await _repo.getToken();
    if (token == null) {
      state = const AuthState(isReady: true);
      return;
    }

    try {
      final user = await _buildUserFromToken(token);
      state = state.copyWith(
        isAuthenticated: true,
        user: user,
        userSet: true,
        isLoading: false,
        isReady: true,
        error: null,
        errorSet: true,
      );
    } catch (_) {
      await _repo.clearSession();
      state = const AuthState(isReady: true);
    }
  }

  Map<String, dynamic> _decodeJwtPayload(String token) {
    final parts = token.split('.');
    if (parts.length < 2) {
      throw StateError('invalid_auth_response');
    }

    final payload = utf8.decode(base64Url.decode(base64Url.normalize(parts[1])));
    final decoded = jsonDecode(payload);
    if (decoded is! Map<String, dynamic>) {
      throw StateError('invalid_auth_response');
    }

    return decoded;
  }

  AuthUser _decodedUserFromPayload(Map<String, dynamic> payload) {
    final id = payload['sub'];
    final role = payload['role'];
    final exp = payload['exp'];

    if (id is! String || role is! String) {
      throw StateError('invalid_auth_response');
    }

    if (exp is int) {
      final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
      if (exp <= now) {
        throw StateError('expired_session');
      }
    }

    final allowedStoreIds = payload['allowedStoreIds'] is List
        ? (payload['allowedStoreIds'] as List).whereType<String>().toList()
        : <String>[];

    return AuthUser(
      id: id,
      role: role,
      tenantId: payload['tenantId'] as String?,
      allowedStoreIds: allowedStoreIds,
      email: payload['email'] as String?,
      fullName: payload['fullName'] as String?,
    );
  }

  AuthUser _mergeUser(AuthUser decoded, Map<String, dynamic>? profile) {
    if (profile == null) return decoded;

    final allowedStoreIds = profile['allowedStoreIds'] is List
        ? (profile['allowedStoreIds'] as List).whereType<String>().toList()
        : decoded.allowedStoreIds;

    return AuthUser(
      id: profile['id'] as String? ?? decoded.id,
      role: profile['role'] as String? ?? decoded.role,
      tenantId: profile['tenantId'] as String? ?? decoded.tenantId,
      allowedStoreIds: allowedStoreIds,
      email: profile['email'] as String? ?? decoded.email,
      fullName: profile['fullName'] as String? ?? decoded.fullName,
    );
  }

  Future<AuthUser> _buildUserFromToken(String token) async {
    final decoded = _decodedUserFromPayload(_decodeJwtPayload(token));

    try {
      final profile = await _repo.getUserProfile(decoded.id);
      return _mergeUser(decoded, profile);
    } catch (_) {
      return decoded;
    }
  }

  String _normalizeError(Object error) {
    if (error is DioException) {
      if (error.response?.statusCode == 401) return 'invalid_credentials';
      if (error.response?.statusCode == 403) return 'access_forbidden';
    }

    final message = error.toString();
    if (message.contains('invalid_auth_response')) return 'invalid_auth_response';
    return 'unexpected_auth_error';
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null, errorSet: true);
    try {
      final session = await _repo.login(email, password);
      final user = await _buildUserFromToken(session.accessToken);
      state = state.copyWith(
        isAuthenticated: true,
        user: user,
        userSet: true,
        isLoading: false,
        isReady: true,
        error: null,
        errorSet: true,
      );
      return true;
    } catch (error) {
      await _repo.clearSession(notify: false);
      state = state.copyWith(
        isAuthenticated: false,
        user: null,
        userSet: true,
        isLoading: false,
        isReady: true,
        error: _normalizeError(error),
        errorSet: true,
      );
      return false;
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AuthState(isReady: true);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repo = ref.watch(authRepositoryProvider);
  return AuthNotifier(repo);
});
