// Set up Firebase testing.
import {ProjectConfig} from "../../../utilities/constants";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const testCfg = require("firebase-functions-test")({
  databaseURL: ProjectConfig.DATABASE_URL,
  storageBucket: ProjectConfig.STORAGE_BUCKET,
  projectId: ProjectConfig.PROJECT_ID,
}, "./src/tests/newfreedom_service_account_key.json");

// Set up requirements.
import {removeProfilePicture} from "../../../index";
import {describe, beforeEach, afterEach, it, expect} from "vitest";
import {generateMock} from "@anatine/zod-mock";
import {
  deleteUserById,
  getUserById,
  setUserById,
  User,
} from "../../../models/data/user";
import {Timestamp} from "firebase-admin/firestore";

describe("removeProfilePicture", () => {
  const userId = "remove_profile_picture_user_id";
  const userWithPic = "user_with_profile_pic_id";

  async function cleanup() {
    await deleteUserById(userId);
    await deleteUserById(userWithPic);
  }

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
    testCfg.cleanup();
  });

  describe("with valid auth, user has profilePicURL set", () => {
    it("should clear profilePicURL+remove profile pic file", async () => {
      // Create test user.
      const userData = generateMock(User, {
        stringMap: {
          id: () => userWithPic,
          authorId: () => userWithPic,
        },
      });
      userData.profilePicURL = "https://www.testing.com/pic.jpg",
      userData.createdAt = Timestamp.fromDate(new Date());
      userData.updatedAt = Timestamp.fromDate(new Date());
      await setUserById(userWithPic, userData);

      // Call the wrapped function.
      const wrapped = testCfg.wrap(removeProfilePicture);
      const data = {};
      const auth = {
        uid: userWithPic,
      };
      const req = {
        data: data,
        auth: auth,
      };
      const result = await wrapped(req);

      // Check for updated profilePicURL.
      const user = await getUserById(userWithPic);
      expect(user.profilePicURL!.length).to.eql(0);
      expect(result.success).to.eql(true);
    });
  });

  describe("with valid auth, user has no profilePicURL set", () => {
    it("should return success", async () => {
      // Create test user.
      const userData = generateMock(User, {
        stringMap: {
          id: () => userId,
          authorId: () => userId,
        },
      });
      userData.profilePicURL = "",
      userData.createdAt = Timestamp.fromDate(new Date());
      userData.updatedAt = Timestamp.fromDate(new Date());
      await setUserById(userId, userData);

      // Call the wrapped function.
      const wrapped = testCfg.wrap(removeProfilePicture);
      const data = {};
      const auth = {
        uid: userId,
      };
      const req = {
        data: data,
        auth: auth,
      };
      const result = await wrapped(req);

      // Check for success.
      const user = await getUserById(userId);
      expect(user.profilePicURL!.length).to.eql(0);
      expect(result.success).to.eql(true);
    });
  });
});
