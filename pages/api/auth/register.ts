// pages/api/auth/register.ts
import { AuthService } from "@/services/auth";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res
        .status(req.method === "GET" ? 405 : 400)
        .json({ error: "Method not allowed" });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    // Validate username
    if (username.length < 3 || username.length > 20) {
      return res
        .status(400)
        .json({ error: "Username must be between 3 and 20 characters" });
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return res
        .status(400)
        .json({ error: "Username can only contain letters and numbers" });
    }

    // Validate password
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    await AuthService.registerUser(username, password);
    const token = await AuthService.loginUser(username, password);
    return res.json({ token });
  } catch (error) {
    console.error("Error in registration:", error);
    return res
      .status(
        error instanceof Error && error.message === "Username already taken"
          ? 400
          : 500
      )
      .json({ error: error.message || "Registration failed" });
  }
}
