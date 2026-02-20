// Set up Firebase testing.
import {ProjectConfig} from "../../../utilities/constants";
import {getAuth} from "firebase-admin/auth";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const testCfg = require("firebase-functions-test")({
  databaseURL: ProjectConfig.DATABASE_URL,
  storageBucket: ProjectConfig.STORAGE_BUCKET,
  projectId: ProjectConfig.PROJECT_ID,
}, "./src/tests/newfreedom_service_account_key.json");
import {describe, beforeEach, afterEach, it, expect} from "vitest";
import {
  deleteDeletedUserById,
  deleteUserById,
  getUserById,
  setUserById,
  User,
} from "../../../models/data/user";
import {generateMock} from "@anatine/zod-mock";
import {deleteUser} from "../../../index";
import {Timestamp} from "firebase-admin/firestore";

describe("deleteUser", () => {
  const userId = "user_to_delete_id";

  async function cleanup() {
    await deleteUserById(userId);
    await deleteDeletedUserById(userId);
    try {
      // WARNING: this is slow sometimes and running tests back to back
      // will sometimes cause an exception to be thrown that there is no
      // user to update which is because this deleteUser from the previous
      // run finally completed during the next run
      await getAuth().deleteUsers([userId]);
    } catch (error) {
      // NO-OP
    }
  }

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
    testCfg.cleanup();
  });

  describe("with valid auth", () => {
    // Increase timeout for lengthy auth operations.

    it("should delete user and disable auth", async () => {
      // Create auth for user that will be suspended.
      await getAuth().createUser({
        uid: userId,
        email: "user@example.com",
        disabled: false,
      });

      // Create database user that will be suspended.
      const userData = generateMock(User, {
        stringMap: {
          id: () => userId,
        },
      });
      userData.createdAt = Timestamp.fromDate(new Date());
      userData.updatedAt = Timestamp.fromDate(new Date());
      await setUserById(userId, userData);

      // Call the wrapped function.
      const wrapped = testCfg.wrap(deleteUser);
      const data = {};
      const auth = {
        uid: userId,
      };
      const req = {
        data: data,
        auth: auth,
      };
      await wrapped(req);

      // Check for archived user.
      const user = await getUserById(userId);
      expect(user.archived).to.eql(true);

      // Check for user auth disabled.
      const authUserAfter = await getAuth().getUser(userId);
      expect(authUserAfter.disabled).to.eql(true);
    });
  });
});
