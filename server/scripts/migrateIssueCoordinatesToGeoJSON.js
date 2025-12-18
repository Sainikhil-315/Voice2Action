const mongoose = require("mongoose");
const Issue = require("../models/Issue");
require("dotenv").config();

const MONGO_URI = process.env.MONGODB_URI;

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  /* ================= FIND BAD DOCUMENTS ================= */
  const issues = await Issue.find({
    "location.coordinates.type": "Point",
    "location.coordinates.lat": { $exists: true },
    "location.coordinates.lng": { $exists: true }
  });

  console.log(`🔍 Found ${issues.length} issues with WRONG coordinate format`);

  if (issues.length > 0) {
    console.log("📄 Sample BEFORE migration:");
    console.log(JSON.stringify(issues[0].location.coordinates, null, 2));
  }

  /* ================= MIGRATION ================= */
  let updated = 0;

  for (const issue of issues) {
    const { lat, lng } = issue.location.coordinates;

    issue.location.coordinates = {
      type: "Point",
      coordinates: [lng, lat] // IMPORTANT: [lng, lat]
    };

    await issue.save();
    updated++;
  }

  console.log(`✅ Migration complete. Updated ${updated} issues.`);

  /* ================= VERIFICATION ================= */
  const sample = await Issue.findOne(
    { "location.coordinates.type": "Point" },
    { "location.coordinates": 1 }
  ).lean();

  console.log("🔎 Sample AFTER migration:");
  console.log(JSON.stringify(sample.location.coordinates, null, 2));

  /* ================= INDEX CHECK ================= */
  const indexes = await Issue.collection.indexes();
  const hasGeoIndex = indexes.some(
    idx => idx.key && idx.key["location.coordinates"] === "2dsphere"
  );

  console.log(
    hasGeoIndex
      ? "✅ 2dsphere index EXISTS"
      : "❌ 2dsphere index MISSING (geo queries will fail)"
  );

  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB");
}

migrate().catch(err => {
  console.error("❌ Migration error:", err);
  process.exit(1);
});
