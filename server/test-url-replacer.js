/**
 * Test script for URL replacer utility
 * Run with: node test-url-replacer.js
 */

import { replaceArticleUrls } from './src/utils/urlReplacer.js';

console.log('🧪 Testing URL Replacer\n');

// Test 1: Single card reference
const test1 = `<p>The <a href="[INSERT THE EMPEROR URL]">Emperor</a> represents authority.</p>`;
console.log('Test 1: Single card reference');
console.log('Input:', test1);
console.log('Output:', replaceArticleUrls(test1));
console.log('');

// Test 2: Multiple card references
const test2 = `
<p>Compare <a href="[INSERT THE FOOL URL]">The Fool</a> with <a href="[INSERT THE MAGICIAN URL]">The Magician</a>.</p>
<p>Also see <a href="[INSERT DEATH URL]">Death card</a>.</p>
`;
console.log('Test 2: Multiple card references');
console.log('Input:', test2);
console.log('Output:', replaceArticleUrls(test2));
console.log('');

// Test 3: Minor Arcana cards
const test3 = `
<p>The <a href="[INSERT ACE OF SWORDS URL]">Ace of Swords</a> brings clarity.</p>
<p>The <a href="[INSERT TWO OF CUPS URL]">Two of Cups</a> represents partnership.</p>
`;
console.log('Test 3: Minor Arcana cards');
console.log('Input:', test3);
console.log('Output:', replaceArticleUrls(test3));
console.log('');

// Test 4: Court cards
const test4 = `
<p>The <a href="[INSERT KING OF WANDS URL]">King of Wands</a> is a leader.</p>
<p>The <a href="[INSERT QUEEN OF PENTACLES URL]">Queen of Pentacles</a> is nurturing.</p>
`;
console.log('Test 4: Court cards');
console.log('Input:', test4);
console.log('Output:', replaceArticleUrls(test4));
console.log('');

// Test 5: Mixed case and extra spaces
const test5 = `<p>See <a href="[INSERT   THE   EMPEROR   URL]">The Emperor</a></p>`;
console.log('Test 5: Extra spaces');
console.log('Input:', test5);
console.log('Output:', replaceArticleUrls(test5));
console.log('');

// Test 6: Real blog content example
const test6 = `
<h2>Understanding The Emperor</h2>
<p>The Emperor card (card IV in the Major Arcana) represents structure, authority, and leadership.
When compared to <a href="[INSERT THE EMPRESS URL]">The Empress</a>, we see a balance between
masculine and feminine energies.</p>

<p>In a reading with <a href="[INSERT ACE OF SWORDS URL]">Ace of Swords</a>, the Emperor
emphasizes mental clarity and strategic thinking. Meanwhile, paired with
<a href="[INSERT KING OF PENTACLES URL]">King of Pentacles</a>, it suggests practical success.</p>

<h3>Related Cards</h3>
<ul>
  <li><a href="[INSERT THE HIEROPHANT URL]">The Hierophant</a> - Traditional structures</li>
  <li><a href="[INSERT FOUR OF WANDS URL]">Four of Wands</a> - Foundation building</li>
  <li><a href="[INSERT KNIGHT OF SWORDS URL]">Knight of Swords</a> - Decisive action</li>
</ul>
`;
console.log('Test 6: Real blog content');
console.log('Input:', test6);
console.log('Output:', replaceArticleUrls(test6));
console.log('');

console.log('✅ All tests complete!');
