// Set up Firebase testing.
import {ProjectConfig, USERS_COLLECTION} from "../../../utilities/constants";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const testCfg = require("firebase-functions-test")({
  databaseURL: ProjectConfig.DATABASE_URL,
  storageBucket: ProjectConfig.STORAGE_BUCKET,
  projectId: ProjectConfig.PROJECT_ID,
}, "./src/tests/newfreedom_service_account_key.json");
import {describe, beforeEach, afterEach, it, expect} from "vitest";
import {deleteUserById, getUserById, User} from "../../../models/data/user";
import {generateMock} from "@anatine/zod-mock";
import {setDocument} from "../../../utilities/setDocument";
import {unblockUser} from "../../../index";

describe("unblockUser", () => {
  const userId = "unblock_user_user_id";
  const unblockId = "unblock_user_unblock_id";

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

  describe("with valid auth and parameters, no existing blocks", () => {
    it("should result in zero blocked users", async () => {
      // Create test user.
      const userData = generateMock(User, {stringMap: {id: () => userId}});
      userData.blockedUsers = [];
      await setDocument(USERS_COLLECTION, userId, userId, userData);

      // Call the wrapped function.
      const wrapped = testCfg.wrap(unblockUser);
      const data = {
        id: unblockId,
      };
      const auth = {uid: userId};
      const req = {
        data: data,
        auth: auth,
      };
      const result = await wrapped(req);

      // Check for updated blockedUsers list.
      const document = await getUserById(userId);
      expect(document.blockedUsers).to.be.empty;
      expect(result.success).to.eql(true);
    });
  });

  describe("with valid auth and parameters, removing from block list", () => {
    it("should update a user's blockedUsers list", async () => {
      // Create test user.
      const userData = generateMock(User, {stringMap: {id: () => userId}});
      userData.blockedUsers = [unblockId, "another_blocked_id"];
      await setDocument(USERS_COLLECTION, userId, userId, userData);

      // Call the wrapped function.
      const wrapped = testCfg.wrap(unblockUser);
      const data = {
        id: unblockId,
      };
      const auth = {uid: userId};
      const req = {
        data: data,
        auth: auth,
      };
      const result = await wrapped(req);

      // Check for updated blockedUsers list.
      const document = await getUserById(userId);
      expect(document.blockedUsers.length).to.eql(1);
      expect(result.success).to.eql(true);
    });
  });
});
