// Set up Firebase testing.
import {ProjectConfig} from "../../../utilities/constants";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const testCfg = require("firebase-functions-test")({
  databaseURL: ProjectConfig.DATABASE_URL,
  storageBucket: ProjectConfig.STORAGE_BUCKET,
  projectId: ProjectConfig.PROJECT_ID,
}, "./src/tests/newfreedom_service_account_key.json");
import {markMessageAsRead} from "../../../index";
import {describe, beforeEach, afterEach, it, expect} from "vitest";
import {generateMock} from "@anatine/zod-mock";
import {
  deleteMessageById,
  getMessageById,
  Message,
  setMessageById,
} from "../../../models/data/message";
import {Timestamp} from "firebase-admin/firestore";

describe("markMessageAsRead", () => {
  const userId = "mark_message_as_read_user_id";
  const authorId = "mark_message_as_read_author_id";
  const messageId = "mark_message_as_read_message_id";

  beforeEach(async () => {
    await deleteMessageById(messageId);
  });

  afterEach(async () => {
    await deleteMessageById(messageId);
    testCfg.cleanup();
  });

  describe("with valid auth and parameters", () => {
    it("should update message readBy", async () => {
      // Create test message.
      const messageData = generateMock(Message);
      messageData.id = messageId;
      messageData.ownerId = authorId;
      messageData.readBy = [];
      messageData.createdAt = Timestamp.fromDate(new Date());
      messageData.updatedAt = Timestamp.fromDate(new Date());
      await setMessageById(messageId, messageData);

      // Call the wrapped function.
      const wrapped = testCfg.wrap(markMessageAsRead);
      const data = {
        id: messageId,
      };
      const auth = {
        uid: userId,
      };
      const req = {
        data: data,
        auth: auth,
      };
      const result = await wrapped(req);

      // Check for updated message readBy.
      const message = await getMessageById(messageId);
      expect(message.readBy[0]).to.eql(userId);
      expect(result.success).to.eql(true);
    });
  });

  describe("with valid auth and parameters, message readBy exists", () => {
    it("should return success", async () => {
      // Create test message.
      const messageData = generateMock(Message);
      messageData.id = messageId;
      messageData.ownerId = authorId;
      messageData.readBy = ["user_id"];
      messageData.createdAt = Timestamp.fromDate(new Date());
      messageData.updatedAt = Timestamp.fromDate(new Date());
      await setMessageById(messageId, messageData);

      // Call the wrapped function.
      const wrapped = testCfg.wrap(markMessageAsRead);
      const data = {
        id: messageId,
      };
      const auth = {
        uid: userId,
      };
      const req = {
        data: data,
        auth: auth,
      };
      const result = await wrapped(req);

      // Check for updated message readBy.
      const message = await getMessageById(messageId);
      expect(message.readBy[1]).to.eql(userId);
      expect(result.success).to.eql(true);
    });
  });
});
