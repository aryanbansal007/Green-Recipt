import express from "express";
import {
  createReceipt,
  getCustomerReceipts,
  getMerchantReceipts,
  getReceiptById,
  claimReceipt,
  markReceiptPaid,
} from "../controllers/receiptController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { createReceiptSchema, receiptIdParamSchema, claimReceiptSchema } from "../validators/receiptSchemas.js";

const router = express.Router();

router.post("/", protect, requireRole("merchant", "customer"), validate(createReceiptSchema), createReceipt);
router.get("/customer", protect, requireRole("customer"), getCustomerReceipts);
router.get("/merchant", protect, requireRole("merchant"), getMerchantReceipts);
router.post("/claim", protect, requireRole("customer"), validate(claimReceiptSchema), claimReceipt);
router.patch("/:id/mark-paid", protect, requireRole("merchant"), validate(receiptIdParamSchema), markReceiptPaid);
router.get("/:id", protect, validate(receiptIdParamSchema), getReceiptById);

export default router;
