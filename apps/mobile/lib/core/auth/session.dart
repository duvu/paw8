import 'package:flutter/foundation.dart';

const accessTokenStorageKey = 'access_token';
const refreshTokenStorageKey = 'refresh_token';
const expiresAtStorageKey = 'auth_expires_at';

class SessionRefreshNotifier extends ChangeNotifier {
  void notifySessionChanged() {
    notifyListeners();
  }
}

final sessionRefreshNotifier = SessionRefreshNotifier();
