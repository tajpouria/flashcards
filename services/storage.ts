import { Storage } from "@google-cloud/storage";
import { FlashCard, Group } from "../types";
import { AuthService } from "./auth";

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || "flashcards-app";
const bucket = storage.bucket(bucketName);

export class StorageService {
  static async saveUserData(username: string, groups: Group[]) {
    const filename = `users/${username}/flashcards.json`;
    const file = bucket.file(filename);

    try {
      await file.save(JSON.stringify(groups), {
        contentType: "application/json",
        metadata: {
          cacheControl: "no-cache",
        },
      });
    } catch (error) {
      console.error("Error saving user data:", error);
      throw error;
    }
  }

  static async getUserData(username: string): Promise<Group[]> {
    const filename = `users/${username}/flashcards.json`;
    const file = bucket.file(filename);

    try {
      const [exists] = await file.exists();
      if (!exists) {
        return [];
      }

      const [content] = await file.download();
      return JSON.parse(content.toString());
    } catch (error) {
      console.error("Error getting user data:", error);
      throw error;
    }
  }
}
