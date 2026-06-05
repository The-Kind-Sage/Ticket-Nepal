import { clerkClient } from "@clerk/express";

const authUser = async (req, res, next) => {
  try {
    // UPDATED: Call as a function per the deprecation warning
    const { userId } = req.auth(); 

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const user = await clerkClient.users.getUser(userId);
    
    req.user = {
      _id: userId,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Cinema User",
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(401).json({ success: false, message: "Invalid session" });
  }
};

export default authUser;