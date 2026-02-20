// Set up Firebase testing.
import {INVITES_COLLECTION, ProjectConfig} from "../../../utilities/constants";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const testCfg = require("firebase-functions-test")({
  databaseURL: ProjectConfig.DATABASE_URL,
  storageBucket: ProjectConfig.STORAGE_BUCKET,
  projectId: ProjectConfig.PROJECT_ID,
}, "./src/tests/newfreedom_service_account_key.json");

import {getInviteCode} from "../../../index";
import {describe, beforeEach, afterEach, it, expect} from "vitest";
import {getInviteById} from "../../../models/data/invite";
import {
  deleteDocByWhereClause,
} from "../../../utilities/deleteDocByWhereClause";

describe("getInviteCode", () => {
  const uid = "valid_user_id";

  beforeEach(async () => {
    await deleteDocByWhereClause(INVITES_COLLECTION, "ownerId", uid);
  });

  afterEach(async () => {
    await deleteDocByWhereClause(INVITES_COLLECTION, "ownerId", uid);
    testCfg.cleanup();
  });

  describe("with valid auth", () => {
    it("should return an invite code", async () => {
      // Call the wrapped function.
      const wrapped = testCfg.wrap(getInviteCode);
      const data = {};
      const auth = {
        uid: uid,
      };
      const req = {
        data: data,
        auth: auth,
      };
      const inviteId = await wrapped(req);

      // Check for invite code existing.
      const document = await getInviteById(inviteId);
      expect(document.inviteCode).to.eql(inviteId);
    });
  });
});
