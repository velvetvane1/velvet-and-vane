import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import Reveal from '@/components/ui/Reveal';

const ARTICLES = [
  {
    title: 'How to Make a Fragrance Last Longer',
    excerpt:
      'Spraying on dry skin, not rubbing your wrists together, and where on your body actually holds scent best — the small habits that change everything.',
    tag: 'Guide',
    gradient: 'linear-gradient(155deg,#191517,#7A1833)',
  },
  {
    title: 'What "Oud" Actually Is',
    excerpt:
      'Not a single note but a resin formed when Aquilaria trees are infected by a specific mold — and why that origin story explains its price.',
    tag: 'Ingredients',
    gradient: 'linear-gradient(155deg,#5A0F24,#C9A46C)',
  },
  {
    title: 'Layering Fragrances Without Making a Mess of It',
    excerpt:
      'A base note from one bottle, a top note from another — layering works, but only with a bit of structure. Here is ours.',
    tag: 'Guide',
    gradient: 'linear-gradient(155deg,#191517,#A98456)',
  },
  {
    title: 'Inside the Atelier: A Day With Our Perfumer',
    excerpt:
      'From the first accord sketch to the hundredth adjustment — what actually happens between "idea" and "bottled."',
    tag: 'Behind the Scenes',
    gradient: 'linear-gradient(155deg,#191517,#C9A46C)',
  },
];

export default function Journal() {
  const { settings } = useSiteSettings();
  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-6 md:px-10">
      <Helmet>
        <title>Journal — {settings.siteName}</title>
        <meta name="description" content={`News and notes from ${settings.siteName}.`} />
      </Helmet>

      <Reveal className="mb-14 max-w-xl">
        <p className="eyebrow mb-3">The Journal</p>
        <h1 className="heading-display text-4xl md:text-5xl">Notes on Scent</h1>
      </Reveal>

      <div className="grid md:grid-cols-2 gap-8">
        {ARTICLES.map((article, i) => (
          <Reveal key={article.title} delay={i * 0.08}>
            <article className="group cursor-default">
              <div className="aspect-[16/9] rounded-sm mb-5" style={{ background: article.gradient }} />
              <p className="text-[11px] tracking-widest2 uppercase text-gold/70 mb-2">{article.tag}</p>
              <h2 className="font-display text-2xl mb-2 group-hover:text-gold transition-colors">{article.title}</h2>
              <p className="text-sm text-ivory/60 leading-relaxed">{article.excerpt}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
