/**
 * Internal testing seed script.
 * Populates realistic test data so you don't have to manually create
 * users/reports before testing Manage Users / Manage Reports / Manage Routes.
 *
 * Run from server/: node seed.js
 * (Safe to re-run — it clears previously-seeded data first, identified by
 * a "seed-" prefix on emails, so it never touches real accounts you made by hand.)
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import User from "./models/User.js";
import TrashReport from "./models/TrashReport.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const PLACEHOLDER_IMAGES = {
  cardboard: "iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAIAAAAiOjnJAAACF0lEQVR4nO3SQQ3AIADAQEDgpGAE0zOxhmS5U9BH59nPgK+t2wH8k7FIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLxAue5wLXZovw/QAAAABJRU5ErkJggg==",
  glass: "iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAIAAAAiOjnJAAACF0lEQVR4nO3SQQ3AIADAQEDfFKEB0TOxhmS5U9BH53P2gK+t2wH8k7FIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLxAvMagLi6FWtoAAAAABJRU5ErkJggg==",
  metal: "iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAIAAAAiOjnJAAACF0lEQVR4nO3SsQ3AIADAMOD/sTMzZ/aJRkiVfUGGzGefAV9btwP4J2ORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWiRdKWgNqgUb2jgAAAABJRU5ErkJggg==",
  paper: "iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAIAAAAiOjnJAAACGElEQVR4nO3SQQ3AIADAQMC/uEnghY6ZWEOy3Cnoo/PsZ8DX1u0A/slYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMRcJYJIxFwlgkjEXCWCSMReIFLSMEJiC2aG4AAAAASUVORK5CYII=",
  plastic: "iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAIAAAAiOjnJAAACF0lEQVR4nO3SQQ3AIADAQEDmhCEHbTOxhmS5U9BH57PPgK+t2wH8k7FIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLhLFIGIuEsUgYi4SxSBiLxAuSQwM+RDyqrAAAAABJRU5ErkJggg==",
  trash: "iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAIAAAAiOjnJAAACF0lEQVR4nO3SsQ3AIADAMODRLsz8P/aJRkiVfUGGzLOfAV9btwP4J2ORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWiRdC3QLB0sYdYgAAAABJRU5ErkJggg==",
};

const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi"];
const WASTE_TYPES = ["cardboard", "glass", "metal", "paper", "plastic", "trash"];

// Roughly real coordinate clusters per city, so route optimization has
// something geographically sensible to work with, not random noise
const CITY_COORDS = {
  Karachi: [24.8607, 67.0011],
  Lahore: [31.5497, 74.3436],
  Islamabad: [33.6844, 73.0479],
  Rawalpindi: [33.6007, 73.0679],
};

function jitter(base, amount = 0.05) {
  return base + (Math.random() - 0.5) * amount;
}

function writePlaceholderImage(wasteType) {
  const filename = `seed-${wasteType}-${Date.now()}-${Math.floor(Math.random() * 10000)}.png`;
  const buffer = Buffer.from(PLACEHOLDER_IMAGES[wasteType], "base64");
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  // Clean up any previously-seeded data (identified by the seed- email prefix)
  // without touching real accounts you created by hand
  const oldSeedUsers = await User.find({ email: /^seed-/ });
  const oldSeedUserIds = oldSeedUsers.map((u) => u._id);
  await TrashReport.deleteMany({ userId: { $in: oldSeedUserIds } });
  await User.deleteMany({ email: /^seed-/ });
  console.log("Cleared previous seed data.");

  // --- Users ---
  const admin = await User.create({
    fullName: "Seed Admin",
    email: "seed-admin@test.com",
    passwordHash: "password123", // hashed automatically by User's pre-save hook
    role: "admin",
  });

  const users = [];
  const userNames = ["Ayesha Khan", "Bilal Ahmed", "Sara Malik", "Usman Tariq"];
  for (let i = 0; i < userNames.length; i++) {
    const u = await User.create({
      fullName: userNames[i],
      email: `seed-user${i + 1}@test.com`,
      passwordHash: "password123",
      role: "user",
      city: CITIES[i % CITIES.length],
    });
    users.push(u);
  }
  console.log(`Created 1 admin + ${users.length} users (all password: password123)`);

  // --- Trash Reports ---
  // A spread of statuses, confidence levels, and cities, so every admin
  // screen (Manage Reports, Manage Routes optimizer, needsReview filtering)
  // has real varied data to work with immediately.
  const reportsToCreate = [
    // Plenty of Pending, varied cities — these are what the route optimizer will use
    { status: "Pending", city: "Karachi", confidence: 0.91 },
    { status: "Pending", city: "Karachi", confidence: 0.87 },
    { status: "Pending", city: "Karachi", confidence: 0.76 },
    { status: "Pending", city: "Karachi", confidence: 0.35 }, // low confidence -> needsReview
    { status: "Pending", city: "Lahore", confidence: 0.82 },
    { status: "Pending", city: "Lahore", confidence: 0.6 },
    { status: "Pending", city: "Islamabad", confidence: 0.93 },
    { status: "Pending", city: "Islamabad", confidence: 0.29 }, // needsReview
    { status: "InProgress", city: "Karachi", confidence: 0.88 },
    { status: "InProgress", city: "Lahore", confidence: 0.71 },
    { status: "Completed", city: "Karachi", confidence: 0.95 },
    { status: "Completed", city: "Rawalpindi", confidence: 0.84 },
    { status: "Completed", city: "Rawalpindi", confidence: 0.38 }, // needsReview, but already completed — edge case worth having
  ];

  const descriptions = [
    "Pile of garbage near the main road",
    "Dumped construction waste behind the market",
    "Overflowing bin left uncollected for days",
    "Mixed household trash near the park entrance",
    "",
    "Discarded furniture and household items",
  ];

  for (const r of reportsToCreate) {
    const wasteType = WASTE_TYPES[Math.floor(Math.random() * WASTE_TYPES.length)];
    const reporter = users[Math.floor(Math.random() * users.length)];
    const [baseLat, baseLng] = CITY_COORDS[r.city];

    await TrashReport.create({
      userId: reporter._id,
      imageUrl: writePlaceholderImage(wasteType),
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      wasteType,
      aiConfidence: r.confidence,
      needsReview: r.confidence < 0.4,
      latitude: jitter(baseLat),
      longitude: jitter(baseLng),
      city: r.city,
      hasGpsData: true,
      status: r.status,
    });
  }
  console.log(`Created ${reportsToCreate.length} trash reports across ${CITIES.length} cities.`);

  console.log("\n--- Seed complete ---");
  console.log("Admin login:  seed-admin@test.com / password123");
  console.log("User login:   seed-user1@test.com / password123  (also user2/3/4)");
  console.log("Try: log in as admin -> Manage Reports (see everything) -> Manage Routes -> Optimize Route (filter city=Karachi)");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
