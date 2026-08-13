import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import 'package:app/core/theme.dart';
import 'package:app/models/models.dart';

// Mirrors ConversationScreen._buildAdvertiserBanner (conversation_screen.dart):
// the admin-only block showing the property reference, the advertiser's
// name/role and the "Contacter l'annonceur" button that jumps to the
// linked owner<->admin conversation. Regression guard for the bug where an
// admin opened a legitimate client interest and saw nothing identifying
// which property/advertiser it was about, with no way to relay the
// conversation forward.
class FakeConversation {
  final String propertyTitle;
  final double propertyPrice;
  final String listingType;
  final String conversationType;
  final String? relatedConversationId;
  final String? advertiserName;
  final String? advertiserRole;

  FakeConversation({
    required this.propertyTitle,
    required this.propertyPrice,
    required this.listingType,
    required this.conversationType,
    this.relatedConversationId,
    this.advertiserName,
    this.advertiserRole,
  });
}

Widget buildAdvertiserBannerLike({
  required FakeConversation? conversation,
  required bool isAdmin,
  required void Function(String relatedId) onContactAdvertiser,
}) {
  if (conversation == null || !isAdmin || conversation.conversationType != 'searcher_admin') {
    return const SizedBox.shrink();
  }

  final priceFormat = NumberFormat('#,##0', 'fr_FR');
  final advertiserName = conversation.advertiserName?.trim().isNotEmpty == true
      ? conversation.advertiserName!
      : 'Annonceur inconnu';
  final advertiserRoleLabel = roleConfigs[conversation.advertiserRole]?.label ?? conversation.advertiserRole ?? '';
  final relatedId = conversation.relatedConversationId;

  return Container(
    width: double.infinity,
    padding: const EdgeInsets.all(AppSpacing.md),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${conversation.propertyTitle} · \$${priceFormat.format(conversation.propertyPrice)}'
          '${conversation.listingType == 'rent' ? '/mois' : ''}',
        ),
        Text.rich(
          TextSpan(
            text: advertiserName,
            children: [
              if (advertiserRoleLabel.isNotEmpty) TextSpan(text: '  ($advertiserRoleLabel)'),
            ],
          ),
        ),
        if (relatedId != null)
          GestureDetector(
            onTap: () => onContactAdvertiser(relatedId),
            child: const Row(
              children: [
                Icon(LucideIcons.messageCircle, size: 14),
                Text("Contacter l'annonceur"),
              ],
            ),
          ),
      ],
    ),
  );
}

void main() {
  testWidgets('shows property, advertiser name/role and contact button for admin on a searcher_admin conversation', (tester) async {
    String? tappedId;
    final conversation = FakeConversation(
      propertyTitle: 'Villa cozzi',
      propertyPrice: 500,
      listingType: 'rent',
      conversationType: 'searcher_admin',
      relatedConversationId: 'owner-conv-id',
      advertiserName: 'Jean Propriétaire',
      advertiserRole: 'owner',
    );

    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: buildAdvertiserBannerLike(
          conversation: conversation,
          isAdmin: true,
          onContactAdvertiser: (id) => tappedId = id,
        ),
      ),
    ));

    expect(find.textContaining('Villa cozzi'), findsOneWidget);
    expect(find.textContaining('500'), findsOneWidget);
    expect(find.textContaining('Jean Propriétaire'), findsOneWidget);
    expect(find.textContaining('Propriétaire'), findsOneWidget);
    expect(find.text("Contacter l'annonceur"), findsOneWidget);

    await tester.tap(find.text("Contacter l'annonceur"));
    expect(tappedId, 'owner-conv-id');
  });

  testWidgets('renders nothing for the owner_admin side of the pair', (tester) async {
    final conversation = FakeConversation(
      propertyTitle: 'Villa cozzi',
      propertyPrice: 500,
      listingType: 'rent',
      conversationType: 'owner_admin',
      relatedConversationId: 'searcher-conv-id',
      advertiserName: 'Jean Propriétaire',
      advertiserRole: 'owner',
    );

    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: buildAdvertiserBannerLike(
          conversation: conversation,
          isAdmin: true,
          onContactAdvertiser: (_) {},
        ),
      ),
    ));

    expect(find.textContaining('Villa cozzi'), findsNothing);
    expect(find.text("Contacter l'annonceur"), findsNothing);
  });

  testWidgets('renders nothing for a non-admin viewer', (tester) async {
    final conversation = FakeConversation(
      propertyTitle: 'Villa cozzi',
      propertyPrice: 500,
      listingType: 'rent',
      conversationType: 'searcher_admin',
      relatedConversationId: 'owner-conv-id',
      advertiserName: 'Jean Propriétaire',
      advertiserRole: 'owner',
    );

    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: buildAdvertiserBannerLike(
          conversation: conversation,
          isAdmin: false,
          onContactAdvertiser: (_) {},
        ),
      ),
    ));

    expect(find.textContaining('Villa cozzi'), findsNothing);
  });

  testWidgets('falls back to a placeholder name when the advertiser has none set', (tester) async {
    final conversation = FakeConversation(
      propertyTitle: 'Villa cozzi',
      propertyPrice: 500,
      listingType: 'sale',
      conversationType: 'searcher_admin',
      relatedConversationId: null,
      advertiserName: null,
      advertiserRole: null,
    );

    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: buildAdvertiserBannerLike(
          conversation: conversation,
          isAdmin: true,
          onContactAdvertiser: (_) {},
        ),
      ),
    ));

    expect(find.textContaining('Annonceur inconnu'), findsOneWidget);
    // No related conversation id yet -> no dangling "contact" button.
    expect(find.text("Contacter l'annonceur"), findsNothing);
  });
}
