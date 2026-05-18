/**
 * insert-hub-previews.ts
 *
 * Replaces the simple <ul> link list inside the "Explore [Card] In Depth"
 * section of each Major Arcana hub article with richer article-preview blocks.
 *
 * The Fool's mangled block (pasted via CMS, now escaped HTML) is handled by
 * the same replacement logic — it finds the <ul> and swaps it out.
 *
 * Usage:
 *   cd server
 *   DATABASE_URL="..." npx tsx scripts/insert-hub-previews.ts           # dry run
 *   DATABASE_URL="..." npx tsx scripts/insert-hub-previews.ts --apply   # write to DB
 *
 * To add a card: add an entry to UPDATES below, then re-run.
 * Already-updated articles (no <ul> after "Explore In Depth") are skipped safely.
 *
 * All 22 hub slugs:
 *   death-complete-guide          judgement-complete-guide
 *   justice-complete-guide        strength-complete-guide
 *   temperance-complete-guide     the-chariot-complete-guide
 *   the-devil-complete-guide      the-emperor-complete-guide
 *   the-empress-complete-guide    the-fool-complete-guide
 *   the-hanged-man-complete-guide the-hermit-complete-guide
 *   the-hierophant-complete-guide the-high-priestess-complete-guide
 *   the-lovers-complete-guide     the-magician-complete-guide
 *   the-moon-complete-guide       the-star-complete-guide
 *   the-sun-complete-guide        the-tower-complete-guide
 *   the-world-complete-guide      wheel-of-fortune-complete-guide
 */

import pg from 'pg';

const APPLY = process.argv.includes('--apply');

// ---------------------------------------------------------------------------
// UPDATES — add one entry per card as you write the HTML blocks.
// slug: exact BlogPost.slug value
// htmlBlock: the 12 article-preview divs to insert
// ---------------------------------------------------------------------------
const UPDATES: Array<{ slug: string; htmlBlock: string }> = [
  // ─── The Fool ─────────────────────────────────────────────────────────────
  {
    slug: 'the-fool-complete-guide',
    htmlBlock: `<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-fool-as-yes-or-no">The Fool: Yes or No</a></h3>
  <p>The Fool upright usually points toward a clear yes, especially when the situation asks for openness, movement, or trust in something new. This card supports fresh starts that are still unfolding naturally rather than fully planned from the beginning. Reversed, the answer becomes more cautious because hesitation, poor timing, or scattered energy may still need attention first. The article looks closely at when this card supports taking the leap and when slowing down creates better ground beneath you.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-fool-love-advice">The Fool: Love Advice</a></h3>
  <p>The Fool in love advice readings encourages emotional openness without demanding certainty before connection begins. Upright, this card supports curiosity, emotional honesty, and the willingness to meet love as it unfolds naturally. Reversed, it reflects fear, hesitation, or movement that feels emotionally ungrounded beneath the excitement. The article explores how to recognise the difference between healthy emotional risk and avoiding what your heart already knows.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-fool-love-outcome">The Fool: Love Outcome</a></h3>
  <p>The Fool as a love outcome points toward emotional beginnings that are alive with possibility and still taking shape. This card carries movement, attraction, and the feeling that something meaningful may grow through shared experience rather than fixed plans. Reversed, uncertainty or emotional inconsistency begins affecting how safely the connection can move forward. The article sits with what happens when a relationship feels real before it feels stable.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-fool-as-feelings">The Fool: As Feelings</a></h3>
  <p>The Fool as feelings reflects emotional excitement, curiosity, and genuine openness toward someone. Upright, these feelings feel light, hopeful, and emotionally alive in the present moment. Reversed, uncertainty, hesitation, or emotional inconsistency may shape how those feelings are expressed outwardly. The article explores what happens when attraction exists before emotional clarity fully settles into place.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-fool-how-someone-sees-you">The Fool: How Someone Sees You</a></h3>
  <p>The Fool how someone sees you reflects an impression that feels vivid, open, and difficult to forget. Upright, you may appear adventurous, emotionally alive, or naturally drawn toward new experiences. Reversed, the same energy can feel unpredictable, emotionally unsettled, or difficult for others to fully understand. The article looks closely at how your energy shapes the emotional response you create in other people.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-fool-breakup">The Fool: Breakups</a></h3>
  <p>The Fool and breakups speak of endings that create space for emotional movement and new beginnings over time. Upright, this card carries healing through openness, emotional freedom, and gradual rediscovery of yourself after loss. Reversed, the separation may still feel emotionally unfinished, with confusion or hesitation lingering underneath the surface. The article explores how to move forward when the future still feels uncertain beneath your feet.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-fool-reconciliation">The Fool: Reconciliation</a></h3>
  <p>The Fool reconciliation readings carry the possibility of a sincere fresh start between two people. Upright, this card reflects openness, emotional honesty, and the willingness to reconnect without dragging every past hurt forward unchanged. Reversed, something still feels unstable, emotionally unfinished, or not fully ready to support lasting reunion yet. The article looks at whether hope alone is carrying the connection or whether genuine emotional renewal is beginning to form.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-fool-current-situation">The Fool: Current Situation</a></h3>
  <p>The Fool as current situation reflects a moment that feels open, unsettled, and still becoming something new. This card focuses less on final outcomes and more on the emotional energy surrounding where you stand right now. Upright, there is movement, openness, and quiet trust in what is beginning to form. The article explores how to navigate situations that feel emotionally real before they feel fully defined.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-fool-obstacle-challenge">The Fool: Obstacle or Challenge</a></h3>
  <p>The Fool as obstacle reflects tension around risk, uncertainty, and stepping into situations without a clear emotional map. Upright and reversed, this card can point toward hesitation, poor timing, impulsive choices, or fear of beginning at all. The challenge often sits between freedom and grounding, movement and awareness. The article looks at what happens when uncertainty itself becomes the thing you are struggling to face.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-fool-as-a-person">The Fool: As a Person</a></h3>
  <p>The Fool as a person feels open, curious, emotionally light, and naturally drawn toward new experiences. There is warmth in this energy because it meets life directly instead of waiting for guarantees first. Reversed, the same openness may become scattered, inconsistent, or emotionally difficult to rely on fully. The article explores how this person moves through connection, freedom, and emotional trust in everyday life.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-fool-career-advice">The Fool: Career Advice</a></h3>
  <p>The Fool career advice supports movement toward something new, especially when curiosity and growth matter more than complete certainty. Upright, this card encourages trust in the learning process itself rather than waiting until every detail feels secure. Reversed, it asks for steadier planning, grounded choices, or the courage to stop delaying necessary change. The article explores how career growth often begins before confidence fully catches up.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-fool-spirituality">The Fool: Spirituality</a></h3>
  <p>The Fool spirituality readings carry the feeling of standing at the edge of inner growth with openness and quiet trust. Upright, this card reflects spiritual renewal, willingness to begin again, and connection to the unknown without needing total certainty first. Reversed, the inner call toward growth may still exist while fear or disconnection makes movement feel difficult. The article explores what spiritual trust looks like when the path ahead is only partly visible.</p>
</div>`,
  },

  // ─── The Tower ────────────────────────────────────────────────────────────
  {
    slug: 'the-tower-complete-guide',
    htmlBlock: `<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-tower-as-yes-or-no">The Tower: Yes or No</a></h3>
  <p>The Tower yes or no is rarely a calm or comfortable yes because this card brings sudden truth and necessary disruption. Upright, it often points to a no that clears away false stability, while reversed it can show delays, avoidance, or a situation already weakening underneath. This article looks at how The Tower behaves in love, work, and personal questions where the answer feels tied to change rather than certainty. It speaks to moments when the real question is not whether something will happen, but what remains once the dust settles.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-tower-love-advice">The Tower: Love Advice</a></h3>
  <p>The Tower love advice asks you to face what can no longer be ignored in a relationship or emotional connection. Upright, it shows honesty arriving suddenly, while reversed it reflects tension building beneath silence or avoidance. This article explores how love changes when old patterns break apart and both people are forced to see each other clearly. It sits with the difficult space between losing what felt safe and making room for something more honest.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-tower-love-outcome">The Tower: Love Outcome</a></h3>
  <p>The Tower love outcome points to relationships shaped by truth, exposure, and major emotional shifts. Sometimes this card shows a connection rebuilding after a shock, and other times it marks the end of something already unstable. Reversed, it often reflects a slower crisis that has been growing quietly for some time. This article helps make sense of what happens when love reaches a turning point that cannot be avoided.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-tower-as-feelings">The Tower: As Feelings</a></h3>
  <p>The Tower as feelings reflects emotions that feel intense, exposed, and difficult to contain. Upright, it can show someone overwhelmed by sudden clarity, while reversed it points to feelings being held back despite strong inner pressure. This article explores how fear, attraction, truth, and emotional shock can exist together at the same time. It answers the question of what happens when someone feels deeply shaken by their connection to you.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-tower-how-someone-sees-you">The Tower: How Someone Sees You</a></h3>
  <p>The Tower how someone sees you speaks of a presence that changes things simply by being there. Upright, it reflects someone who sees you as honest, confronting, or impossible to ignore, while reversed it can show unease around the effect you have on them. This article looks at the emotional impact you leave on others and why your presence may feel both unsettling and freeing. Some people enter a room quietly yet still change the atmosphere completely.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-tower-breakup">The Tower: Breakups</a></h3>
  <p>The Tower and breakups often point to endings that arrive with force, truth, or sudden clarity. Upright, this card can reflect a sharp separation or revelation, while reversed it may show a relationship weakening slowly over time. This article explores the emotional aftermath of connections that could no longer hold together as they once did. It speaks to the painful moment when relief and heartbreak arrive together.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-tower-reconciliation">The Tower: Reconciliation</a></h3>
  <p>The Tower around reconciliation suggests that something important has broken and cannot simply return to how it was before. Upright, it often shows that the foundation is still too unstable, while reversed it points to unresolved tension remaining beneath the surface. This article explores whether trust, honesty, and emotional safety can realistically be rebuilt after a major rupture. It stays close to the difficult question of what still exists once the shock has passed.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-tower-current-situation">The Tower: Current Situation</a></h3>
  <p>The Tower as current situation reflects a period where life feels unstable, exposed, or suddenly different. Upright, it points to disruption already unfolding, while reversed it often shows pressure building quietly before a change fully arrives. This article looks at the emotional and practical reality of living through uncertain ground while trying to stay steady. Some situations begin breaking apart long before anyone admits what is happening.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-tower-obstacle-challenge">The Tower: Obstacle or Challenge</a></h3>
  <p>The Tower as obstacle describes challenges tied to sudden truth, instability, or resistance to necessary change. Upright, the difficulty often comes from shock or exposure, while reversed it can reflect exhaustion from delaying what already needs to shift. This article explores what it feels like to stand inside uncertainty while old structures weaken around you. It gives shape to struggles that become harder the longer they stay unspoken.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-tower-as-a-person">The Tower: As a Person</a></h3>
  <p>The Tower as a person often describes someone shaped by hard truths, deep honesty, or life-changing experiences. Upright, this energy can feel direct and emotionally awake, while reversed it may appear tense, guarded, or quietly overwhelmed. This article explores the difference between someone who has accepted change and someone still resisting it internally. There is a certain intensity in people who have already seen their old life fall apart once before.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-tower-career-advice">The Tower: Career Advice</a></h3>
  <p>The Tower career advice prepares you for professional change that may feel sudden but has likely been building for a while. Upright, it points to unstable structures breaking down, while reversed it suggests warning signs that still need attention. This article explores work situations where security, identity, and direction are all shifting at once. It speaks to the uneasy moment when staying where you are no longer feels possible.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-tower-spirituality">The Tower: Spirituality</a></h3>
  <p>The Tower and spirituality bring attention to beliefs, fears, and inner truths that can no longer stay hidden. Upright, this card reflects spiritual awakening through disruption, while reversed it often shows someone hesitating before a necessary inner shift. This article explores how growth can feel raw when old certainty begins to collapse from within. It speaks to the strange clarity that appears after something false finally gives way.</p>
</div>`,
  },

  // ─── The Moon ─────────────────────────────────────────────────────────────
  {
    slug: 'the-moon-complete-guide',
    htmlBlock: `<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-moon-as-yes-or-no">The Moon: Yes or No</a></h3>
  <p>The Moon yes or no rests in uncertainty rather than certainty or final answers. Upright, it often points to a not yet because hidden details or emotional confusion still affect the situation, while reversed it suggests caution as truth slowly begins to surface. This article explores how intuition, timing, fear, and mixed signals shape the meaning of this card in yes or no readings. It speaks to moments where your instincts feel strong even though the path ahead still feels unclear.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-moon-love-advice">The Moon: Love Advice</a></h3>
  <p>The Moon love advice asks you to move slowly when emotions feel complicated or difficult to fully trust. Upright, it reflects uncertainty, hidden feelings, or emotional projection, while reversed it points to clarity beginning to return after confusion. This article explores how relationships can feel emotionally intense long before they become emotionally clear. Some love stories ask for patience because what matters most has not fully surfaced yet.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-moon-love-outcome">The Moon: Love Outcome</a></h3>
  <p>The Moon love outcome points to connections where uncertainty and emotional depth exist side by side. Upright, it often reflects relationships shaped by confusion or hidden truths, while reversed it suggests the emotional fog slowly lifting over time. This article explores what happens when strong feelings arrive before trust, honesty, or stability fully take shape. It stays close to the question of whether love can grow clearly after a long period of uncertainty.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-moon-as-feelings">The Moon: As Feelings</a></h3>
  <p>The Moon as feelings reflects emotions that feel layered, uncertain, and difficult to explain openly. Upright, this card often shows someone overwhelmed by instinct, doubt, or hidden longing, while reversed it points to emotional awareness slowly becoming clearer. This article explores how fear and attraction can exist together inside the same emotional experience. It speaks to situations where someone's feelings feel real, yet their behaviour remains hard to understand.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-moon-how-someone-sees-you">The Moon: How Someone Sees You</a></h3>
  <p>The Moon how someone sees you describes a perception shaped by imagination, uncertainty, and emotional projection. Upright, it often reflects someone seeing you through their own fears or fantasies, while reversed it suggests a clearer impression slowly forming underneath that confusion. This article explores why you may appear mysterious, difficult to read, or emotionally significant to someone else. Sometimes what people sense around you feels stronger to them than what you openly reveal.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-moon-breakup">The Moon: Breakups</a></h3>
  <p>The Moon and breakups often point to endings filled with unanswered questions and emotions that never fully settled. Upright, this card reflects confusion during or after the separation, while reversed it suggests hidden truths slowly becoming easier to understand. This article explores the emotional uncertainty that lingers when both people leave the relationship without complete clarity. It speaks to breakups where understanding the ending takes longer than the ending itself.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-moon-reconciliation">The Moon: Reconciliation</a></h3>
  <p>The Moon as reconciliation speaks about reunion through a space of uncertainty, instinct, and emotional caution. Upright, it often shows confusion or hidden truths still affecting the connection, while reversed it suggests honesty beginning to create steadier ground. This article explores whether reconciliation can truly work when trust still feels fragile or incomplete. It stays with the uneasy space between emotional hope and emotional clarity.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-moon-current-situation">The Moon: Current Situation</a></h3>
  <p>The Moon as current situation reflects a period where answers feel uncertain and instinct becomes more important than logic. Upright, it points to hidden influences or emotional confusion affecting the present moment, while reversed it suggests clarity slowly returning after a long fog. This article explores what it feels like to live inside a situation that carries emotional depth without clear direction yet. Some situations only begin making sense once you stop forcing certainty too quickly.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-moon-obstacle-challenge">The Moon: Obstacle or Challenge</a></h3>
  <p>The Moon as obstacle describes challenges rooted in uncertainty, fear, and shifting emotional perception. Upright, this card often reflects confusion that makes decisions difficult, while reversed it points to uncomfortable truths beginning to rise into view. This article explores the strain of moving forward without fully trusting what you see or feel. It gives shape to situations where doubt quietly changes the way you respond to everything around you.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-moon-as-a-person">The Moon: As a Person</a></h3>
  <p>The Moon as a person describes someone deeply connected to emotion, memory, and instinct. Upright, this energy feels intuitive and emotionally aware, while reversed it can appear withdrawn, uncertain, or difficult to understand clearly. This article explores the personality of someone who experiences life through shifting inner layers rather than straightforward logic. There is often a quiet complexity in them that other people sense long before they fully understand it.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-moon-career-advice">The Moon: Career Advice</a></h3>
  <p>The Moon career advice brings attention to uncertainty around work, direction, and long-term stability. This card often appears when the full picture is hidden and instinct matters as much as practical planning. The article explores career situations where confusion, hesitation, or emotional exhaustion make clear decisions harder to reach. It speaks to moments when your professional life feels unsettled even if outward appearances still seem steady.</p>
</div>
<div class="article-preview">
  <h3 style="text-align: center;"><a href="https://celestiarcana.com/blog/the-moon-spirituality">The Moon: Spirituality</a></h3>
  <p>The Moon and spirituality speak to inner growth shaped by intuition, dreams, and quiet emotional truth. Upright, this card reflects the subconscious moving closer to awareness, while reversed it suggests hidden inner material beginning to surface more clearly. This article explores spiritual experiences that feel meaningful long before they fully make sense in words. Some inner changes happen slowly and still manage to alter the way you understand yourself completely.</p>
</div>`,
  },

  // ─── Paste the next card's entry here ─────────────────────────────────────
  // {
  //   slug: 'the-magician-complete-guide',
  //   htmlBlock: `...12 article-preview divs...`,
  // },
];

// ---------------------------------------------------------------------------

/**
 * Finds and returns [start, end] indices of the <ul>...</ul> block that
 * appears inside the "Explore [Card] In Depth" section.
 * Returns null if the section or list cannot be located.
 */
function findUlBlock(html: string): [number, number] | null {
  const lower = html.toLowerCase();

  // Find the "Explore ... In Depth" heading
  const exploreIdx = lower.indexOf('explore');
  if (exploreIdx === -1) return null;

  // Find the <ul opening tag after that heading
  const ulStart = html.indexOf('<ul', exploreIdx);
  if (ulStart === -1) return null;

  // Find the matching </ul>
  const ulEnd = html.indexOf('</ul>', ulStart);
  if (ulEnd === -1) return null;

  return [ulStart, ulEnd + '</ul>'.length];
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log(APPLY ? '=== APPLYING CHANGES ===' : '=== DRY RUN (pass --apply to write) ===');
  console.log(`Processing ${UPDATES.length} card(s)\n`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const { slug, htmlBlock } of UPDATES) {
    const { rows } = await pool.query<{
      id: string;
      status: string;
      contentEn: string;
    }>(`SELECT id, status, "contentEn" FROM "BlogPost" WHERE slug = $1 AND "deletedAt" IS NULL`, [
      slug,
    ]);

    if (rows.length === 0) {
      console.log(`✗ NOT FOUND: ${slug}`);
      notFound++;
      continue;
    }

    const row = rows[0];
    const range = findUlBlock(row.contentEn);

    if (!range) {
      console.log(
        `↷ SKIP (no <ul> found in Explore section — may already be updated): [${row.status}] ${slug}`
      );
      skipped++;
      continue;
    }

    const [ulStart, ulEnd] = range;
    const existingUl = row.contentEn.substring(ulStart, ulEnd);

    // Safety check: make sure this looks like a link list or the mangled block
    if (!existingUl.includes('celestiarcana.com/blog/') && !existingUl.includes('&lt;div')) {
      console.log(`⚠  SKIP (unexpected <ul> content): [${row.status}] ${slug}`);
      skipped++;
      continue;
    }

    const newContentEn =
      row.contentEn.substring(0, ulStart) + htmlBlock + row.contentEn.substring(ulEnd);

    if (APPLY) {
      await pool.query(`UPDATE "BlogPost" SET "contentEn" = $1 WHERE id = $2`, [
        newContentEn,
        row.id,
      ]);
      console.log(`✓ UPDATED: [${row.status}] ${slug}`);
    } else {
      console.log(`→ WOULD REPLACE <ul> in: [${row.status}] ${slug}`);
      console.log(`  Replacing ${ulEnd - ulStart} chars with ${htmlBlock.length} chars`);
      console.log(`  Existing list starts: ${existingUl.substring(0, 80).replace(/\n/g, ' ')}...`);
    }

    updated++;
  }

  console.log(
    `\nSummary: ${updated} ${APPLY ? 'updated' : 'would be updated'} | ${skipped} skipped | ${notFound} not found`
  );
  if (!APPLY && updated > 0) {
    console.log('Run with --apply to write changes.');
  }

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
