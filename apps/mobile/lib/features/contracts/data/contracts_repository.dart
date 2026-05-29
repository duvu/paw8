import 'package:mobile/core/api/api_client.dart';

class ContractsRepository {
  final ApiClient _client;
  ContractsRepository(this._client);

  Future<Map<String, dynamic>> getContracts({
    String? query,
    String? status,
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _client.dio.get(
      '/contracts',
      queryParameters: {
        if (query != null && query.isNotEmpty) 'query': query,
        if (status != null && status != 'ALL') 'status': status,
        'page': page,
        'limit': limit,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getContract(String id) async {
    final response = await _client.dio.get('/contracts/$id');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getContractTransactions(String id) async {
    final response = await _client.dio.get('/contracts/$id/transactions');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getUpcomingDue() async {
    final response = await _client.dio.get('/contracts/upcoming-due');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getOverdue() async {
    final response = await _client.dio.get('/contracts/overdue');
    return response.data as Map<String, dynamic>;
  }
}
