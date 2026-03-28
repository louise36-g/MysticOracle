# Translation Prompt for Yes/No Tarot Article

Use this prompt with Claude (Anthropic API or console) to translate the yes-or-no-tarot blog article. The article is ~59,000 characters / ~7,500 words with 85 card entries.

**Recommended approach:** Split into 3 parts due to size:
1. Metadata + overview + intro sections (up to `<h2 id="major-arcana">`)
2. Major Arcana cards (22 entries)
3. Minor Arcana suits (56 entries) — may need 2 passes (Wands+Cups, then Swords+Pentacles)

---

## PROMPT

```
You are translating a tarot website article from English to French (France, not Canadian French). This is a yes/no tarot guide page for CelestiArcana.com — a mystical tarot site with a warm, wise, grounded tone.

## WHAT TO TRANSLATE

Translate ALL text content: paragraphs, headings, blockquotes, answer labels, navigation labels, and link text (the visible text inside <a> tags).

## WHAT TO PRESERVE EXACTLY (DO NOT CHANGE)

- All HTML tags, attributes, and structure
- All CSS classes (e.g. `class="answer-label yes"`, `class="suit-nav"`)
- All `href` URLs — keep them pointing to `/tarot/...` (NOT `/fr/tarot/...`; the system auto-rewrites links for French pages)
- All `id` attributes on headings (e.g. `id="major-arcana"`, `id="wands"`)
- The `href="#..."` anchor links in the suit-nav (keep as `#major-arcana`, `#wands`, etc.)
- All `target`, `rel` attributes on links
- The `[[cta:yes-no]]` shortcodes — keep exactly as-is
- Star dividers: `✦ ✦ ✦` — keep as-is
- Empty paragraphs `<p></p>` or `<p><br></p>` — keep as-is

## ANSWER LABEL TRANSLATIONS

The article uses colored answer labels in this format:
```html
<span class="answer-label yes">YES</span>
<span class="answer-label no">NO</span>
<span class="answer-label conditional">CONDITIONAL YES</span>
<span class="answer-label not-yet">NOT YET</span>
```

Translate the visible label text as follows:
- `YES` → `OUI`
- `NO` → `NON`
- `CONDITIONAL YES` → `OUI CONDITIONNEL`
- `NOT YET` → `PAS ENCORE`

**Keep the CSS class unchanged** (e.g. `class="answer-label yes"` stays the same even though the text becomes `OUI`).

## SUIT-NAV TRANSLATION

The navigation at the top uses anchor links. Translate the visible text only:
```html
<div class="suit-nav">
<a href="#major-arcana">Arcanes Majeurs</a>
<a href="#wands">Bâtons</a>
<a href="#cups">Coupes</a>
<a href="#swords">Épées</a>
<a href="#pentacles">Pentacles</a>
</div>
```

## CARD NAME TRANSLATIONS

Each card appears as an H3 heading with a link. Translate the card name (visible text) to the standard French tarot name. Keep the href URL unchanged.

Standard French card names:
- The Fool → Le Mat
- The Magician → Le Bateleur
- The High Priestess → La Papesse
- The Empress → L'Impératrice
- The Emperor → L'Empereur
- The Hierophant → Le Pape
- The Lovers → Les Amoureux
- The Chariot → Le Chariot
- Strength → La Force
- The Hermit → L'Ermite
- Wheel of Fortune → La Roue de Fortune
- Justice → La Justice
- The Hanged Man → Le Pendu
- Death → La Mort (ou L'Arcane Sans Nom)
- Temperance → La Tempérance
- The Devil → Le Diable
- The Tower → La Maison Dieu
- The Star → L'Étoile
- The Moon → La Lune
- The Sun → Le Soleil
- Judgement → Le Jugement
- The World → Le Monde

For Minor Arcana:
- Ace → As
- Page → Valet
- Knight → Cavalier
- Queen → Reine
- King → Roi
- Wands → Bâtons
- Cups → Coupes
- Swords → Épées
- Pentacles → Pentacles (or Deniers — use Pentacles for consistency with the site)

Example: "Ace of Wands" → "As de Bâtons", "Queen of Cups" → "Reine de Coupes"

## SECTION HEADING TRANSLATIONS

- "Draw a Card Now" → "Tirez une Carte"
- "How Yes/No Tarot Actually Works" → "Comment Fonctionne le Tirage Oui/Non"
- "The Major Arcana" → "Les Arcanes Majeurs"
- "Wands Tarot Yes or No Meanings" → "Bâtons : Significations Oui ou Non"
- "Cups Tarot Yes or No Meanings" → "Coupes : Significations Oui ou Non"
- "Swords Tarot Yes or No Meanings" → "Épées : Significations Oui ou Non"
- "Pentacles Tarot Yes or No Meanings" → "Pentacles : Significations Oui ou Non"
- "Reading Your Answer: What Comes Next" → "Lire Votre Réponse : Et Après ?"
- "Frequently Asked Questions" → "Questions Fréquentes"
- "Yes / No (Overview)" → "Oui / Non (Aperçu)"

## TONE AND STYLE

- Write as if a French native tarot reader wrote this originally — natural, flowing French
- Use vocabulary that French tarot readers actually search for: "tirage de tarot oui ou non", "signification des cartes", "arcanes majeurs", "tirage gratuit"
- Warm, wise, grounded tone — not mystical fluff, not clinical
- Use "tu" (informal) to match the English "you" — the site speaks directly to the reader
- Preserve the directness and honesty of the interpretations — do not soften YES into MAYBE or add hedging language
- Each card's interpretation should read as a cohesive, natural French paragraph

## SEO KEYWORDS TO WEAVE IN NATURALLY

- tirage oui ou non tarot
- tarot oui ou non gratuit
- signification carte tarot
- arcanes majeurs signification
- tirage de tarot en ligne
- réponse oui ou non tarot

## OUTPUT FORMAT

Return the complete translated HTML content. Do not wrap in code blocks or add commentary — just the raw HTML ready to be inserted as the French content.
```

---

## METADATA TO TRANSLATE SEPARATELY

After the content, also provide translations for:

| Field | English | French |
|-------|---------|--------|
| titleFr | Yes or No Tarot: Every Card Answered | Tarot Oui ou Non : Chaque Carte Expliquée |
| excerptFr | A warm, clear guide to yes or no tarot with honest answers for every card. Draw a card now or browse all 78 meanings. | Guide complet du tarot oui ou non avec des réponses honnêtes pour chaque carte. Tirez une carte maintenant ou explorez les 78 significations. |
| metaTitleFr | Yes or No Tarot: Every Card Answered (+ Free Card Draw) | Tarot Oui ou Non : Toutes les Cartes (+ Tirage Gratuit) |
| metaDescFr | Yes or no tarot guide with every card explained and a free card draw. Get a clear answer and explore all 78 tarot cards. | Guide du tarot oui ou non avec chaque carte expliquée et un tirage gratuit. Obtenez une réponse claire et explorez les 78 cartes du tarot. |
