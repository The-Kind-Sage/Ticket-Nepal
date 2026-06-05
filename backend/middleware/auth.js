import { clerkClient } from "@clerk/express";

export const protectAdminRoute = async (req, res, next) => {
  try {
    // UPDATED: Call as a function req.auth()
    const { userId } = req.auth(); 
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await clerkClient.users.getUser(userId);

    if (!user.privateMetadata || user.privateMetadata.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admins only" });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};