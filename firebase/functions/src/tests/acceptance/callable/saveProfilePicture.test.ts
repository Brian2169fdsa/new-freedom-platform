// Set up Firebase testing.
import {ProjectConfig} from "../../../utilities/constants";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const testCfg = require("firebase-functions-test")({
  databaseURL: ProjectConfig.DATABASE_URL,
  storageBucket: ProjectConfig.STORAGE_BUCKET,
  projectId: ProjectConfig.PROJECT_ID,
}, "./src/tests/newfreedom_service_account_key.json");

// Set up requirements.
import {saveProfilePicture} from "../../../index";
import {describe, beforeEach, afterEach, it, expect} from "vitest";
import {generateMock} from "@anatine/zod-mock";
import {
  deleteUserById,
  getUserById,
  setUserById,
  User,
} from "../../../models/data/user";
import {Timestamp} from "firebase-admin/firestore";

describe("saveProfilePicture", () => {
  const userId = "save_profile_picture_user_id";
  const pictureBase64 = "save_profile_picture_base_64";

  async function cleanup() {
    await deleteUserById(userId);
  }

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
    testCfg.cleanup();
  });

  describe("with valid auth and parameters", () => {
    it("should set user's profilePicURL", async () => {
      // Create test user.
      const userData = generateMock(User, {
        stringMap: {
          id: () => userId,
        },
      });
      userData.createdAt = Timestamp.fromDate(new Date());
      userData.updatedAt = Timestamp.fromDate(new Date());
      await setUserById(userId, userData);

      // Call the wrapped function.
      const wrapped = testCfg.wrap(saveProfilePicture);
      const data = {
        picture: pictureBase64,
      };
      const auth = {
        uid: userId,
      };
      const req = {
        data: data,
        auth: auth,
      };
      const result = await wrapped(req);

      // Check for updated profilePicURL.
      const user = await getUserById(userId);
      expect(user.profilePicURL!.length).to.be.greaterThan(0);
      expect(result.success).to.eql(true);
    });
  });
});
