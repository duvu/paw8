import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/providers/providers.dart';
import 'package:mobile/features/customers/data/customers_repository.dart';

final customersRepositoryProvider = Provider<CustomersRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return CustomersRepository(client);
});

class CustomersState {
  final List<dynamic> customers;
  final bool isLoading;
  final String? error;
  final String query;
  final int page;

  const CustomersState({
    this.customers = const [],
    this.isLoading = false,
    this.error,
    this.query = '',
    this.page = 1,
  });

  CustomersState copyWith({
    List<dynamic>? customers,
    bool? isLoading,
    String? error,
    String? query,
    int? page,
  }) {
    return CustomersState(
      customers: customers ?? this.customers,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      query: query ?? this.query,
      page: page ?? this.page,
    );
  }
}

class CustomersNotifier extends StateNotifier<CustomersState> {
  final CustomersRepository _repo;

  CustomersNotifier(this._repo) : super(const CustomersState()) {
    search('');
  }

  Future<void> search(String query) async {
    state = state.copyWith(isLoading: true, query: query, page: 1, error: null);
    try {
      final data = await _repo.getCustomers(query: query);
      final items = data['data'] as List<dynamic>? ?? [];
      state = state.copyWith(customers: items, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final customersProvider =
    StateNotifierProvider<CustomersNotifier, CustomersState>((ref) {
      final repo = ref.watch(customersRepositoryProvider);
      return CustomersNotifier(repo);
    });
