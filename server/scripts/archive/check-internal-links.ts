import prisma from '../src/db/prisma.js';

async function check() {
  // Check if "the hanged man" exists in tarot articles
  const hangedMan = await prisma.tarotArticle.findFirst({
    where: { slug: { contains: 'hanged' } },
    select: { slug: true, title: true, status: true },
  });

  console.log('=== HANGED MAN ARTICLE ===');
  if (hangedMan) {
    console.log('Found:', hangedMan.slug, '-', hangedMan.title, `[${hangedMan.status}]`);
  } else {
    console.log('NOT FOUND in tarot_articles');
  }

  // Check all tarot articles for "hanged"
  const allTarot = await prisma.tarotArticle.findMany({
    where: { status: 'PUBLISHED', deletedAt: null },
    select: { slug: true, title: true },
  });

  console.log('\n=== ALL PUBLISHED TAROT ARTICLES ===');
  console.log('Total:', allTarot.length);
  const hangedArticles = allTarot.filter(
    a => a.slug.toLowerCase().includes('hanged') || a.title.toLowerCase().includes('hanged')
  );
  console.log('Articles containing "hanged":', hangedArticles.length);
  hangedArticles.forEach(a => console.log('  ', a.slug, '-', a.title));

  // Check the 2 of Swords content
  const twoOfSwords = await prisma.tarotArticle.findFirst({
    where: { slug: { contains: '2-of-swords' } },
    select: { slug: true, content: true },
  });

  if (twoOfSwords) {
    console.log('\n=== 2 OF SWORDS CONTENT ===');
    const content = twoOfSwords.content || '';

    // Find all <a> tags
    const links = content.match(/<a[^>]*href="[^"]*"[^>]*>[^<]*<\/a>/gi);
    console.log('\nHTML links found:', links?.length || 0);
    links?.forEach(l => {
      // Extract href
      const hrefMatch = l.match(/href="([^"]*)"/);
      const textMatch = l.match(/>([^<]*)</);
      console.log('  URL:', hrefMatch?.[1]);
      console.log('  Text:', textMatch?.[1]);
      console.log('  ---');
    });

    // Find shortcodes
    const shortcodes = content.match(/\[\[[^\]]+\]\]/g);
    console.log('\nShortcodes found:', shortcodes?.length || 0);
    shortcodes?.forEach(s => console.log('  ', s));
  }

  await prisma.$disconnect();
}

check();
