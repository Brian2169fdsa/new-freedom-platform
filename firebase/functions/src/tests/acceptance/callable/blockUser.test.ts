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
import {blockUser} from "../../../index";
import {Timestamp} from "firebase-admin/firestore";

describe("blockUser", () => {
  const freshUserId = "fresh_user_id";
  const userWithExistingBlocks = "existing_user_id";
  const blockId = "block_id";

  async function cleanup() {
    await deleteUserById(freshUserId);
    await deleteUserById(userWithExistingBlocks);
  }
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
    testCfg.cleanup();
  });

  describe("with valid auth and parameters, never blocked anyone", () => {
    it("should set user's blockedUsers list", async () => {
      // Create test user.
      const userData = generateMock(User, {stringMap: {id: () => freshUserId}});
      userData.blockedUsers = [];
      const auth = {
        uid: freshUserId,
      };
      userData.createdAt = Timestamp.fromDate(new Date());
      userData.updatedAt = Timestamp.fromDate(new Date());
      await setDocument(USERS_COLLECTION, freshUserId, freshUserId, userData);

      // Call the wrapped function.
      const wrapped = testCfg.wrap(blockUser);
      const data = {
        id: blockId,
      };
      const req = {
        data: data,
        auth: auth,
      };
      const result = await wrapped(req);

      // Check for updated blockedUsers list.
      const document = await getUserById(freshUserId);
      expect(document.blockedUsers[0]).to.eql(blockId);
      expect(result.success).to.eql(true);
    });
  });

  describe("with valid auth and parameters, already blocked users", () => {
    it("should update user's blockedUsers list", async () => {
      // Create test user.
      const userData = generateMock(User, {
        stringMap: {id: () => userWithExistingBlocks},
      });
      userData.blockedUsers = ["already_blocked_1", "already_blocked_2"];

      const auth = {uid: userWithExistingBlocks};
      await setDocument(
        USERS_COLLECTION,
        userWithExistingBlocks,
        userWithExistingBlocks,
        userData,
      );

      // Call the wrapped function.
      const wrapped = testCfg.wrap(blockUser);
      const data = {
        id: blockId,
      };
      const req = {
        data: data,
        auth: auth,
      };
      const result = await wrapped(req);

      // Check for updated blockedUsers list.
      const document = await getUserById(userWithExistingBlocks);
      expect(document.blockedUsers[2]).to.eql(blockId);
      expect(result.success).to.eql(true);
    });
  });
});
