import { z } from "zod";

const emailSchema = z.string().email();
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const roleSchema = z.enum(["customer", "merchant"], { required_error: "Role is required" });

export const loginSchema = {
	body: z.object({
		email: emailSchema,
		password: z.string().min(1, "Password is required"),
		role: roleSchema.default("customer"),
	}),
};

export const customerSignupSchema = {
	body: z.object({
		name: z.string().min(1, "Name is required"),
		email: emailSchema,
		password: passwordSchema,
		confirmPassword: passwordSchema.optional(),
	}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	}),
};

export const merchantSignupSchema = {
	body: z.object({
		shopName: z.string().min(1, "Shop name is required"),
		email: emailSchema,
		password: passwordSchema,
		confirmPassword: passwordSchema.optional(),
	}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	}),
};

export const otpRequestSchema = {
	body: z.object({
		email: emailSchema,
		role: roleSchema.default("customer"),
	}),
};

export const otpVerifySchema = {
	body: z.object({
		email: emailSchema,
		role: roleSchema.default("customer"),
		code: z.string().trim().length(6, "Code must be 6 digits"),
	}),
};

export const forgotPasswordSchema = {
	body: z.object({
		email: emailSchema,
		role: roleSchema.default("customer"),
	}),
};

export const resetPasswordSchema = {
	body: z.object({
		email: emailSchema,
		role: roleSchema.default("customer"),
		otp: z.string().trim().length(6, "Code must be 6 digits"),
		newPassword: passwordSchema,
	}),
};

export const changePasswordSchema = {
	body: z.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: passwordSchema,
	}),
};

const phoneSchema = z
	.string()
	.trim()
	.min(7, "Phone must be at least 7 digits")
	.max(20, "Phone must be at most 20 digits")
	.optional();

const optionalString = (max) =>
	z
		.string()
		.trim()
		.max(max)
		.optional()
		.transform((v) => (v === "" ? undefined : v));

const addressSchema = z
	.object({
		line1: optionalString(120),
		line2: optionalString(120),
		city: optionalString(80),
		state: optionalString(80),
		postalCode: optionalString(20),
		country: optionalString(80),
	})
	.partial()
	.transform((addr) => {
		const cleaned = Object.fromEntries(
			Object.entries(addr || {}).filter(([, v]) => v !== undefined && v !== null && v !== "")
		);
		return Object.keys(cleaned).length ? cleaned : undefined;
	});

export const updateProfileSchema = {
	body: z
		.object({
			name: optionalString(120),
			email: emailSchema.optional().transform((v) => (v === "" ? undefined : v)),
			phone: phoneSchema,
			address: addressSchema.optional(),
		})
		.transform((data) => {
			const cleaned = Object.fromEntries(
				Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== "")
			);
			return cleaned;
		})
		.refine((data) => Object.keys(data).length > 0, {
			message: "At least one field must be provided",
			path: ["name"],
		}),
};
