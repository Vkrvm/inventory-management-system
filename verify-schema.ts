import { prisma } from "./src/lib/db";

async function main() {
  console.log("Checking database schema...");

  try {
    // Check if language and currency columns exist by querying
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'User'
      AND column_name IN ('language', 'currency')
      ORDER BY column_name;
    `);

    console.log("Columns found:", result);

    if (Array.isArray(result) && result.length === 2) {
      console.log("✅ Both language and currency columns exist!");

      // Try to select a user
      const user = await prisma.$queryRawUnsafe(`
        SELECT id, email, language, currency FROM "User" LIMIT 1;
      `);
      console.log("Sample user:", user);
    } else {
      console.log("❌ Missing columns. Need to run migration.");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
