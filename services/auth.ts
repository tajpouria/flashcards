import { Storage } from "@google-cloud/storage";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || "flashcards-app";
const bucket = storage.bucket(bucketName);
const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret";

interface UserData {
  username: string;
  passwordHash: string;
  salt: string;
}

export class AuthService {
  private static async getUserFile(username: string) {
    return bucket.file(`users/${username.toLowerCase()}/auth.json`);
  }

  private static async hashPassword(
    password: string,
    salt: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString("hex"));
      });
    });
  }

  private static generateSalt(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  private static generateToken(username: string): string {
    return jwt.sign({ username }, JWT_SECRET, { expiresIn: "24h" });
  }

  static async registerUser(username: string, password: string): Promise<void> {
    const userFile = await this.getUserFile(username);

    // Check if user already exists
    const [exists] = await userFile.exists();
    if (exists) {
      throw new Error("Username already taken");
    }

    // Create new user
    const salt = this.generateSalt();
    const passwordHash = await this.hashPassword(password, salt);

    const userData: UserData = {
      username,
      passwordHash,
      salt,
    };

    await userFile.save(JSON.stringify(userData), {
      contentType: "application/json",
      metadata: {
        cacheControl: "no-cache",
      },
    });
  }

  static async loginUser(username: string, password: string): Promise<string> {
    const userFile = await this.getUserFile(username);

    try {
      const [exists] = await userFile.exists();
      if (!exists) {
        throw new Error("Invalid username or password");
      }

      const [content] = await userFile.download();
      const userData: UserData = JSON.parse(content.toString());

      const passwordHash = await this.hashPassword(password, userData.salt);

      if (passwordHash !== userData.passwordHash) {
        throw new Error("Invalid username or password");
      }

      return this.generateToken(username);
    } catch (error) {
      console.error("Error during login:", error);
      throw new Error("Invalid username or password");
    }
  }

  static async verifyToken(token: string): Promise<string> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
      return decoded.username;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }
}
