import 'package:flutter/foundation.dart';
import 'package:image/image.dart' as img;

const String kWatermarkText = 'COPYRIGHT 1 FUTUR CHEZ VOUS';
const int _maxDimension = 1600;

/// Burns a repeating, diagonal copyright watermark into the image pixels
/// so it survives cropping, screenshots, or re-saving. Runs synchronously;
/// call via [watermarkImageBytesAsync] to keep it off the UI thread.
Uint8List watermarkImageBytes(Uint8List bytes) {
  // decodeImage can throw (not just return null) while probing malformed
  // input against exotic format decoders, so this must never take down
  // the publish flow — fall back to the untouched original on any failure.
  try {
    final original = img.decodeImage(bytes);
    if (original == null) return bytes;

    final needsResize = original.width > _maxDimension || original.height > _maxDimension;
    final photo = needsResize
        ? img.copyResize(
            original,
            width: original.width >= original.height ? _maxDimension : null,
            height: original.height > original.width ? _maxDimension : null,
          )
        : original;

    final tileText = img.Image(width: 420, height: 70, numChannels: 4);
    img.drawString(
      tileText,
      kWatermarkText,
      font: img.arial24,
      x: 6,
      y: 20,
      color: img.ColorRgba8(255, 255, 255, 140),
    );
    final tile = img.copyRotate(tileText, angle: -28);

    final stepX = tile.width + 50;
    final stepY = tile.height + 70;
    for (var y = -tile.height; y < photo.height + tile.height; y += stepY) {
      for (var x = -tile.width; x < photo.width + tile.width; x += stepX) {
        img.compositeImage(photo, tile, dstX: x, dstY: y);
      }
    }

    return Uint8List.fromList(img.encodeJpg(photo, quality: 88));
  } catch (_) {
    return bytes;
  }
}

Future<Uint8List> watermarkImageBytesAsync(Uint8List bytes) {
  return compute(watermarkImageBytes, bytes);
}
