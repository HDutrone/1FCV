import 'package:flutter_riverpod/flutter_riverpod.dart';

class ModeState {
  final String mode;
  final bool hasSelectedMode;

  const ModeState({this.mode = 'rent', this.hasSelectedMode = false});
}

class ModeController extends StateNotifier<ModeState> {
  ModeController() : super(const ModeState());

  void setMode(String mode) {
    state = ModeState(mode: mode, hasSelectedMode: state.hasSelectedMode);
  }

  void selectMode(String mode) {
    state = ModeState(mode: mode, hasSelectedMode: true);
  }
}

final modeProvider = StateNotifierProvider<ModeController, ModeState>((ref) => ModeController());
