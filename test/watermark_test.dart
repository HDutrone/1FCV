import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:image/image.dart' as img;
import 'package:app/core/watermark.dart';

void main() {
  test('watermarkImageBytes stamps a visible, repeating mark without crashing', () {
    final base = img.Image(width: 1920, height: 1080, numChannels: 3);
    img.fill(base, color: img.ColorRgb8(200, 120, 90));
    final srcBytes = img.encodeJpg(base, quality: 95);

    final result = watermarkImageBytes(srcBytes);
    final decoded = img.decodeImage(result);

    expect(decoded, isNotNull);
    expect(decoded!.width, lessThanOrEqualTo(1600));
    expect(decoded.height, lessThanOrEqualTo(1600));

    // The watermark should have altered pixels relative to the flat source color.
    final originalDecoded = img.decodeImage(srcBytes)!;
    var differingPixels = 0;
    for (var y = 0; y < decoded.height; y += 4) {
      for (var x = 0; x < decoded.width; x += 4) {
        final srcX = (x * originalDecoded.width / decoded.width).floor();
        final srcY = (y * originalDecoded.height / decoded.height).floor();
        if (decoded.getPixel(x, y) != originalDecoded.getPixel(srcX, srcY)) {
          differingPixels++;
        }
      }
    }
    expect(differingPixels, greaterThan(0), reason: 'watermark should visibly alter pixels');
  });

  test('watermarkImageBytes returns original bytes for undecodable input', () {
    final garbage = Uint8List.fromList([1, 2, 3, 4]);
    expect(watermarkImageBytes(garbage), equals(garbage));
  });
}
