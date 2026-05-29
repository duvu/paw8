import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/providers/providers.dart';
import 'package:mobile/features/contracts/data/contracts_repository.dart';

final contractsRepositoryProvider = Provider<ContractsRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return ContractsRepository(client);
});

class ContractsState {
  final List<dynamic> contracts;
  final bool isLoading;
  final String? error;
  final String query;
  final String statusFilter;

  const ContractsState({
    this.contracts = const [],
    this.isLoading = false,
    this.error,
    this.query = '',
    this.statusFilter = 'ALL',
  });

  ContractsState copyWith({
    List<dynamic>? contracts,
    bool? isLoading,
    String? error,
    String? query,
    String? statusFilter,
  }) {
    return ContractsState(
      contracts: contracts ?? this.contracts,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      query: query ?? this.query,
      statusFilter: statusFilter ?? this.statusFilter,
    );
  }
}

class ContractsNotifier extends StateNotifier<ContractsState> {
  final ContractsRepository _repo;

  ContractsNotifier(this._repo) : super(const ContractsState()) {
    load();
  }

  Future<void> load({String? query, String? status}) async {
    state = state.copyWith(
      isLoading: true,
      error: null,
      query: query ?? state.query,
      statusFilter: status ?? state.statusFilter,
    );
    try {
      final data = await _repo.getContracts(
        query: state.query,
        status: state.statusFilter,
      );
      final items = data['data'] as List<dynamic>? ?? [];
      state = state.copyWith(contracts: items, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final contractsProvider =
    StateNotifierProvider<ContractsNotifier, ContractsState>((ref) {
      final repo = ref.watch(contractsRepositoryProvider);
      return ContractsNotifier(repo);
    });
