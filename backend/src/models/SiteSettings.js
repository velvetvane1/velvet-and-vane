import mongoose from 'mongoose';

/**
 * Singleton document (there is only ever one) holding the site's
 * brand identity and the handful of marketing text blocks that are
 * genuinely worth editing without a code deploy — hero copy, footer
 * tagline, and contact details. Everything else (About story, FAQ
 * answers, legal pages) stays as ordinary page content for now.
 */
const siteSettingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: 'Store', trim: true },
    currency: { type: String, default: 'PKR', trim: true, uppercase: true },
    codAdvancePercentage: { type: Number, enum: [10, 20], default: 20 },
    whatsapp: {
      number: { type: String, default: '+923176346085', trim: true },
      prefilledMessage: {
        type: String,
        default: 'Assalam-o-Alaikum! ✨\n\nI would like to know more about your products.',
      },
      businessGreeting: {
        type: String,
        default: 'Assalam-o-Alaikum! ✨\n\nWelcome.\n\nThank you for reaching out to us. Your message has been received successfully, and our team will get back to you shortly.\n\nWe believe in offering not only premium products, but also a trusted and comfortable shopping experience.\n\nDelivery Across Pakistan\nCash on Delivery Available\nNo Advance Payment Required\nPay Only When Your Parcel Is Delivered\n\nYour trust is our priority, and every order is handled with care.\n\nQuality You Can Trust. Elegance You Can Experience. ✨\n\nThank you for choosing us.',
      },
    },
    logo: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    hero: {
      eyebrow: { type: String, default: 'Curated for Everyday Living' },
      titleLine1: { type: String, default: 'Everything You Love,' },
      titleLine2: { type: String, default: 'All in' },
      titleLine3: { type: String, default: 'One Place.' },
      subtitle: {
        type: String,
        default:
          'Discover a carefully curated collection of fashion, fragrances, natural products, traditional favorites, and premium essentials — selected to bring quality and elegance to everyday living.',
      },
    },
    footerTagline: {
      type: String,
      default:
        'A carefully curated collection of fashion, fragrances, natural products, traditional favorites, and premium essentials.',
    },
    contact: {
      email: { type: String, default: 'hello@arwastore.pk' },
      phone: { type: String, default: '+92 317 6346085' },
      address: { type: String, default: 'Pakistan' },
    },
    // Manual wallet details are deliberately kept with the singleton site
    // settings document so an administrator can change them without a deploy.
    paymentSettings: {
      jazzCash: {
        enabled: { type: Boolean, default: true },
        accountNumber: { type: String, default: '03111380517', trim: true },
        accountName: { type: String, default: '', trim: true },
        instructions: { type: String, default: '', trim: true },
      },
      easypaisa: {
        enabled: { type: Boolean, default: true },
        accountNumber: { type: String, default: '03111380517', trim: true },
        accountName: { type: String, default: '', trim: true },
        instructions: { type: String, default: '', trim: true },
      },
    },
  },
  { timestamps: true }
);

const LEGACY_HERO = {
  eyebrow: 'The 2026 Collection — No. VII',
  titleLine1: 'Scent is the',
  titleLine2: 'only memory',
  titleLine3: 'that never fades.',
  subtitle: 'Hand-composed in small batches from rare oud, orris root, and centuries-old distillation houses — worn, not sprayed.',
};

const STORE_HERO = {
  eyebrow: 'Curated for Everyday Living',
  titleLine1: 'Everything You Love,',
  titleLine2: 'All in',
  titleLine3: 'One Place.',
  subtitle: 'Discover a carefully curated collection of fashion, fragrances, natural products, traditional favorites, and premium essentials — selected to bring quality and elegance to everyday living.',
};

const LEGACY_FOOTER_TAGLINE = 'Rare fragrances, hand-composed in small batches for those who wear scent as a signature, not an accessory.';
const STORE_FOOTER_TAGLINE = 'A carefully curated collection of fashion, fragrances, natural products, traditional favorites, and premium essentials.';

/** There is only ever one settings document — this fetches it, creating
 * the default one on first use so the site always has something to render. */
siteSettingsSchema.statics.getSingleton = async function getSingleton() {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  // Migrate only the previous built-in copy; never overwrite an administrator's
  // custom content. This lets already-deployed stores adopt the multi-category
  // storefront wording without a manual database edit.
  const usesLegacyHero = Object.entries(LEGACY_HERO).every(([key, value]) => settings.hero?.[key] === value);
  let changed = false;
  if (usesLegacyHero) {
    settings.hero = STORE_HERO;
    changed = true;
  }
  if (settings.footerTagline === LEGACY_FOOTER_TAGLINE) {
    settings.footerTagline = STORE_FOOTER_TAGLINE;
    changed = true;
  }
  if (changed) await settings.save();
  return settings;
};

export default mongoose.model('SiteSettings', siteSettingsSchema);
