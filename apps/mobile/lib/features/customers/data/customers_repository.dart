import 'package:mobile/core/api/api_client.dart';

class CustomersRepository {
  final ApiClient _client;
  CustomersRepository(this._client);

  Future<Map<String, dynamic>> getCustomers({
    String? query,
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _client.dio.get(
      '/customers',
      queryParameters: {
        if (query != null && query.isNotEmpty) 'query': query,
        'page': page,
        'limit': limit,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getCustomer(String id) async {
    final response = await _client.dio.get('/customers/$id');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getCustomerContracts(String id) async {
    final response = await _client.dio.get('/contracts?customerId=$id');
    return response.data as Map<String, dynamic>;
  }

  Future<void> patchCustomer(
    String id,
    Map<String, dynamic> payload,
  ) async {
    await _client.dio.patch('/customers/$id', data: payload);
  }
}
