// pages/api/flashcards.ts
import { AuthService } from "@/services/auth";
import { StorageService } from "@/services/storage";
import type { NextApiRequest, NextApiResponse } from "next";

interface FlashcardsResponse {
  data?: any;
  error?: string;
  success?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FlashcardsResponse>
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split("Bearer ")[1];
    const username = await AuthService.verifyToken(token);

    switch (req.method) {
      case "GET":
        const data = await StorageService.getUserData(username);
        return res.json({ data });

      case "POST":
        await StorageService.saveUserData(username, req.body);
        return res.json({ success: true });

      default:
        return res
          .status(req.method === "GET" ? 405 : 400)
          .json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in /api/flashcards:", error);
    return res
      .status(
        error instanceof Error && error.message === "Invalid token" ? 401 : 500
      )
      .json({ error: error.message || "Internal Server Error" });
  }
}
