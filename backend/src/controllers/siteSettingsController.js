import SiteSettings from '../models/SiteSettings.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadBuffer, destroyImage } from '../services/cloudinaryService.js';

export const getSiteSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  const publicSettings = settings.toObject();
  // Shoppers need only active wallet instructions. Disabled methods and the
  // full administrative configuration are never sent to checkout clients.
  publicSettings.paymentSettings = Object.fromEntries(
    Object.entries(publicSettings.paymentSettings || {}).filter(([, method]) => method.enabled)
  );
  res.status(200).json({ success: true, settings: publicSettings });
});

const PAKISTANI_MOBILE = /^(?:03\d{9}|\+923\d{9}|923\d{9})$/;

function normalizeWalletNumber(number) {
  return String(number || '').replace(/[\s()-]/g, '');
}

function validateWallet(method, label) {
  const enabled = Boolean(method?.enabled);
  const accountNumber = normalizeWalletNumber(method?.accountNumber);
  if (enabled && !accountNumber) throw ApiError.badRequest(`${label} account number is required when enabled`);
  if (enabled && !PAKISTANI_MOBILE.test(accountNumber)) {
    throw ApiError.badRequest(`${label} account number must be a valid Pakistani mobile number`);
  }
  if ((method?.accountName || '').length > 120) throw ApiError.badRequest(`${label} account holder name is too long`);
  if ((method?.instructions || '').length > 600) throw ApiError.badRequest(`${label} instructions are too long`);
  return { enabled, accountNumber, accountName: (method?.accountName || '').trim(), instructions: (method?.instructions || '').trim() };
}

export const getPaymentSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  res.status(200).json({ success: true, paymentSettings: settings.paymentSettings, codAdvancePercentage: settings.codAdvancePercentage || 20 });
});

export const updatePaymentSettings = asyncHandler(async (req, res) => {
  const { jazzCash, easypaisa, codAdvancePercentage } = req.body || {};
  if (!jazzCash && !easypaisa && codAdvancePercentage === undefined) throw ApiError.badRequest('Provide payment settings to update');
  if (codAdvancePercentage !== undefined && ![10, 20].includes(Number(codAdvancePercentage))) throw ApiError.badRequest('COD advance percentage must be 10% or 20%');
  const settings = await SiteSettings.getSingleton();
  const current = settings.paymentSettings?.toObject?.() || {
    jazzCash: { enabled: true, accountNumber: '', accountName: '', instructions: '' },
    easypaisa: { enabled: true, accountNumber: '', accountName: '', instructions: '' },
  };
  settings.paymentSettings = {
    jazzCash: jazzCash ? validateWallet({ ...current.jazzCash, ...jazzCash }, 'JazzCash') : current.jazzCash,
    easypaisa: easypaisa ? validateWallet({ ...current.easypaisa, ...easypaisa }, 'Easypaisa') : current.easypaisa,
  };
  if (codAdvancePercentage !== undefined) settings.codAdvancePercentage = Number(codAdvancePercentage);
  await settings.save();
  res.status(200).json({ success: true, paymentSettings: settings.paymentSettings, codAdvancePercentage: settings.codAdvancePercentage });
});

export const updateSiteSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  const { siteName, currency, whatsapp, hero, footerTagline, contact } = req.body;

  if (siteName !== undefined) settings.siteName = siteName;
  if (currency !== undefined) settings.currency = currency;
  if (whatsapp) settings.whatsapp = { ...settings.whatsapp.toObject(), ...whatsapp };
  if (hero) settings.hero = { ...settings.hero.toObject(), ...hero };
  if (footerTagline !== undefined) settings.footerTagline = footerTagline;
  if (contact) settings.contact = { ...settings.contact.toObject(), ...contact };
  await settings.save();
  res.status(200).json({ success: true, settings });
});

export const uploadSiteLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image uploaded');

  const settings = await SiteSettings.getSingleton();
  if (settings.logo?.publicId) await destroyImage(settings.logo.publicId);

  const result = await uploadBuffer(req.file.buffer, 'branding');
  settings.logo = { url: result.secure_url, publicId: result.public_id };
  await settings.save();

  res.status(200).json({ success: true, settings });
});

export const removeSiteLogo = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  if (settings.logo?.publicId) await destroyImage(settings.logo.publicId);
  settings.logo = { url: null, publicId: null };
  await settings.save();
  res.status(200).json({ success: true, settings });
});
