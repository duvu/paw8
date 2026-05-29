import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:mobile/features/auth/providers/auth_provider.dart';
import '../../../core/providers/locale_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context)!;
    final currentLocale = ref.watch(localeProvider);
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l.settingsTitle)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            child: ListTile(
              contentPadding: const EdgeInsets.all(20),
              title: Text(l.settingsLanguage),
              subtitle: Text(_localeName(l, currentLocale.languageCode)),
              trailing: const Icon(Icons.translate_rounded),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      l.settingsLanguageOptions,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ),
                ),
                _buildLocaleOption(context, ref, 'vi', l.settingsLanguageVi, currentLocale),
                _buildLocaleOption(context, ref, 'en', l.settingsLanguageEn, currentLocale),
                _buildLocaleOption(context, ref, 'zh', l.settingsLanguageZh, currentLocale),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l.settingsSessionTitle,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    authState.user?.displayName ?? l.homeProfileUnavailable,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    authState.user?.email ?? l.settingsSessionDescription,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocaleOption(BuildContext context, WidgetRef ref, String code,
      String name, Locale current) {
    return ListTile(
      title: Text(name),
      subtitle: Text(_localeDescription(context, code)),
      leading: Radio<String>(
        value: code,
        groupValue: current.languageCode,
        onChanged: (v) =>
            ref.read(localeProvider.notifier).setLocale(Locale(v!)),
      ),
      onTap: () => ref.read(localeProvider.notifier).setLocale(Locale(code)),
    );
  }

  String _localeName(AppLocalizations l, String code) {
    switch (code) {
      case 'vi':
        return l.settingsLanguageVi;
      case 'en':
        return l.settingsLanguageEn;
      case 'zh':
        return l.settingsLanguageZh;
      default:
        return code;
    }
  }

  String _localeDescription(BuildContext context, String code) {
    final l = AppLocalizations.of(context)!;
    switch (code) {
      case 'vi':
        return l.settingsLanguageViDescription;
      case 'en':
        return l.settingsLanguageEnDescription;
      case 'zh':
        return l.settingsLanguageZhDescription;
      default:
        return code;
    }
  }
}
