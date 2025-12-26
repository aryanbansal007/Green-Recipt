import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
	{
		merchantId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Merchant",
			required: true,
			index: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
			maxlength: 50,
		},
		description: {
			type: String,
			trim: true,
			maxlength: 200,
		},
		displayOrder: {
			type: Number,
			default: 0,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		color: {
			type: String,
			trim: true,
			default: "#10b981", // Default emerald color
		},
		icon: {
			type: String,
			trim: true,
		},
	},
	{ timestamps: true }
);

// Compound index for merchant-specific category queries
categorySchema.index({ merchantId: 1, name: 1 }, { unique: true });
categorySchema.index({ merchantId: 1, displayOrder: 1 });
categorySchema.index({ merchantId: 1, isActive: 1 });

// Virtual to get items count (populated when needed)
categorySchema.virtual("itemCount", {
	ref: "Item",
	localField: "_id",
	foreignField: "categoryId",
	count: true,
});

// Ensure virtuals are included in JSON output
categorySchema.set("toJSON", { virtuals: true });
categorySchema.set("toObject", { virtuals: true });

const Category = mongoose.model("Category", categorySchema);

export default Category;
