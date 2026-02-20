// Set up Firebase testing.
import {POSTS_COLLECTION, ProjectConfig} from "../../../utilities/constants";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const testCfg = require("firebase-functions-test")({
  databaseURL: ProjectConfig.DATABASE_URL,
  storageBucket: ProjectConfig.STORAGE_BUCKET,
  projectId: ProjectConfig.PROJECT_ID,
}, "./src/tests/newfreedom_service_account_key.json");

import {expect, it, describe, beforeEach, afterEach} from "vitest";

// Set up requirements.
import {archivePost} from "../../../index";
import {setDocument} from "../../../utilities/setDocument";
import {deletePostById, getPostById, Post} from "../../../models/data/post";
import {generateMock} from "@anatine/zod-mock";
import {Timestamp} from "firebase-admin/firestore";

describe("archivePost", () => {
  const documentId = "document_id";
  const userId = "user_id";

  async function cleanup() {
    await deletePostById(documentId);
  }

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
    testCfg.cleanup();
  });

  describe("with valid auth and parameters", () => {
    it("should set document archived field to true", async () => {
      // Create test document, not archived.
      const docData = generateMock(Post, {stringMap: {id: () => documentId}});
      docData.createdAt = Timestamp.fromDate(new Date());
      docData.updatedAt = Timestamp.fromDate(new Date());
      await setDocument(POSTS_COLLECTION, documentId, userId, docData);

      // Call the wrapped function.
      const wrapped = testCfg.wrap(archivePost);
      const data = {
        id: documentId,
      };
      const auth = {
        uid: userId,
      };
      const req = {
        data: data,
        auth: auth,
      };
      const result = await wrapped(req);

      // Check for document archived.
      const document = await getPostById(documentId);
      expect(document.archived).to.eql(true);
      expect(result.success).to.eql(true);
    });
  });
});
