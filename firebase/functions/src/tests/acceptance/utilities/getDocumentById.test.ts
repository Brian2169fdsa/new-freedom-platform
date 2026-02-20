import {initializeApp} from "firebase-admin/app";
initializeApp();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const testCfg = require("firebase-functions-test")({
  databaseURL: ProjectConfig.DATABASE_URL,
  storageBucket: ProjectConfig.STORAGE_BUCKET,
  projectId: ProjectConfig.PROJECT_ID,
}, "./src/tests/newfreedom_service_account_key.json");
import {afterEach, beforeEach, describe, expect, it} from "vitest";
import {setDocument} from "../../../utilities/setDocument";
import {POSTS_COLLECTION, ProjectConfig} from "../../../utilities/constants";
import {deletePostById, Post} from "../../../models/data/post";
import {getDocumentById} from "../../../utilities/getDocumentById";

describe("getDocumentById", () => {
  it("should throw when data does not parse", async () => {
    const docId = "bad_parse_doc_id";

    beforeEach(async () => {
      await deletePostById(docId);
    });

    afterEach(async () => {
      await deletePostById(docId);
      testCfg.cleanup();
    });

    await setDocument(
      POSTS_COLLECTION, docId, "ownerId", {id: "id", ownerId: "ownerId"});
    await expect(async () =>
      await getDocumentById(Post, POSTS_COLLECTION)(docId)).rejects.toThrow();
  });
});
