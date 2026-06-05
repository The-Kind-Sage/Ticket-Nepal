// Run: node setAdmin.js <userId>
// Get your userId from Clerk Dashboard → Users
import "dotenv/config";
import { createClerkClient } from "@clerk/clerk-sdk-node";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const userId = process.argv[2];

if (!userId) {
  console.error("Usage: node setAdmin.js <userId>");
  process.exit(1);
}

try {
  await clerkClient.users.updateUserMetadata(userId, {
    privateMetadata: { role: "admin" },
  });
  console.log(`✅ User ${userId} is now an admin.`);
} catch (err) {
  console.error("❌ Error:", err.message);
}
