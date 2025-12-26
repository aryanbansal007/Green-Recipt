import express from "express";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import {
	getOnboardingStatus,
	saveBusinessInfo,
	saveOperatingHours,
	saveCategories,
	saveItems,
	completeOnboarding,
	skipOnboarding,
	getFullProfile,
} from "../controllers/merchantController.js";
import {
	getCategories,
	createCategory,
	updateCategory,
	deleteCategory,
	reorderCategories,
} from "../controllers/categoryController.js";
import {
	getItems,
	getItemById,
	createItem,
	createItemsBulk,
	updateItem,
	deleteItem,
	toggleAvailability,
	reorderItems,
} from "../controllers/itemController.js";

const router = express.Router();

// All routes require authentication and merchant role
router.use(protect);
router.use(requireRole("merchant"));

// ==========================================
// ONBOARDING ROUTES
// ==========================================
router.get("/onboarding/status", getOnboardingStatus);
router.post("/onboarding/business-info", saveBusinessInfo);
router.post("/onboarding/operating-hours", saveOperatingHours);
router.post("/onboarding/categories", saveCategories);
router.post("/onboarding/items", saveItems);
router.post("/onboarding/complete", completeOnboarding);
router.post("/onboarding/skip", skipOnboarding);

// ==========================================
// PROFILE ROUTES
// ==========================================
router.get("/profile/full", getFullProfile);

// ==========================================
// CATEGORY ROUTES
// ==========================================
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.patch("/categories/reorder", reorderCategories);
router.patch("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// ==========================================
// ITEM ROUTES
// ==========================================
router.get("/items", getItems);
router.post("/items", createItem);
router.post("/items/bulk", createItemsBulk);
router.patch("/items/reorder", reorderItems);
router.get("/items/:id", getItemById);
router.patch("/items/:id", updateItem);
router.patch("/items/:id/availability", toggleAvailability);
router.delete("/items/:id", deleteItem);

export default router;
