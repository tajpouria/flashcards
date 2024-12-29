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
        .status(!username || !password ? 400 : 401)
        .json({ error: "Username and password are required" });
    }

    const token = await AuthService.loginUser(username, password);
    return res.json({ token });
  } catch (error) {
    console.error("Error in login:", error);
    return res
      .status(
        error instanceof Error &&
          error.message === "Invalid username or password"
          ? 401
          : 500
      )
      .json({ error: error.message || "Login failed" });
  }
}
