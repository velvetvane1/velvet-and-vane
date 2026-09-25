import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { createPaymentIntent, getCodAdvanceConfig, initializeCodAdvance, verifyCodAdvance } from '../controllers/paymentController.js';

const router = Router();

router.post('/create-intent', protect, createPaymentIntent);
router.get('/cod-advance-config', getCodAdvanceConfig);
router.post('/cod-advance/:orderId/initialize', protect, initializeCodAdvance);
router.post('/cod-advance/:orderId/verify', protect, verifyCodAdvance);

export default router;
