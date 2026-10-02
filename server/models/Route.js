import mongoose from "mongoose";

const stopSchema = new mongoose.Schema(
  {
    sequence: { type: Number, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    city: { type: String, default: "" },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "TrashReport", required: true },
  },
  { _id: false }
);

const routeSchema = new mongoose.Schema(
  {
    city: { type: String, required: true },
    wasteType: { type: String, default: "" }, // optional filter used when this route was built
    status: {
      type: String,
      enum: ["Pending", "InProgress", "Completed", "Archived"],
      default: "Pending",
    },
    totalDistance: { type: Number, default: 0 }, // km
    estimatedDuration: { type: Number, default: 0 }, // minutes
    stops: [stopSchema],
  },
  {
    timestamps: { createdAt: "creationDate", updatedAt: "lastModified" },
  }
);

routeSchema.index({ status: 1 });
routeSchema.index({ city: 1 });
routeSchema.index({ "stops.reportId": 1 }); // used by the status-cascade lookup

export default mongoose.model("Route", routeSchema);
