import 'package:flutter/material.dart';
import '../core/theme.dart';

class AppInput extends StatefulWidget {
  final String? label;
  final String? placeholder;
  final String? error;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final bool isPassword;
  final Widget? leftIcon;
  final TextInputType? keyboardType;
  final bool multiline;
  final int? maxLines;
  final String? initialValue;

  const AppInput({
    super.key,
    this.label,
    this.placeholder,
    this.error,
    this.controller,
    this.onChanged,
    this.isPassword = false,
    this.leftIcon,
    this.keyboardType,
    this.multiline = false,
    this.maxLines,
    this.initialValue,
  });

  @override
  State<AppInput> createState() => _AppInputState();
}

class _AppInputState extends State<AppInput> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.label != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text(
                widget.label!.toUpperCase(),
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(color: widget.error != null ? AppColors.error : AppColors.border, width: 1.5),
            ),
            child: Row(
              children: [
                if (widget.leftIcon != null) Padding(padding: const EdgeInsets.only(left: 14), child: widget.leftIcon),
                Expanded(
                  child: TextField(
                    controller: widget.controller,
                    onChanged: widget.onChanged,
                    obscureText: widget.isPassword && _obscure,
                    keyboardType: widget.keyboardType,
                    maxLines: widget.multiline ? (widget.maxLines ?? 4) : 1,
                    style: const TextStyle(fontSize: 15, color: AppColors.text),
                    decoration: InputDecoration(
                      hintText: widget.placeholder,
                      hintStyle: const TextStyle(color: AppColors.textTertiary),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 14),
                    ),
                  ),
                ),
                if (widget.isPassword)
                  IconButton(
                    icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined, size: 18, color: AppColors.textSecondary),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
              ],
            ),
          ),
          if (widget.error != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(widget.error!, style: const TextStyle(color: AppColors.error, fontSize: 12)),
            ),
        ],
      ),
    );
  }
}
