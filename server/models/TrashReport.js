import mongoose from "mongoose";

const trashReportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    imageUrl: { type: String, required: true },
    description: { type: String, default: "" },

    // AI classification results (Phase 2 fine-tuned model)
    wasteType: { type: String, required: true },
    aiConfidence: { type: Number, required: true },
    needsReview: { type: Boolean, default: false }, // true if aiConfidence < 40%

    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    city: { type: String, default: "" },
    hasGpsData: { type: Boolean, default: false }, // false = pin was placed manually

    status: {
      type: String,
      enum: ["Pending", "InProgress", "Completed"],
      default: "Pending",
    },
  },
  {
    timestamps: { createdAt: "reportedAt", updatedAt: "lastModified" },
  }
);

trashReportSchema.index({ status: 1 });
trashReportSchema.index({ city: 1 });
trashReportSchema.index({ userId: 1 });

export default mongoose.model("TrashReport", trashReportSchema);
