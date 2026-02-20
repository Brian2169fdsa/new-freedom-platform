// Set up Firebase testing.
import {ProjectConfig} from "../../../utilities/constants";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const testCfg = require("firebase-functions-test")({
  databaseURL: ProjectConfig.DATABASE_URL,
  storageBucket: ProjectConfig.STORAGE_BUCKET,
  projectId: ProjectConfig.PROJECT_ID,
}, "./src/tests/newfreedom_service_account_key.json");

// Set up requirements.
import {saveMessage} from "../../../index";
import {describe, beforeEach, afterEach, it, expect} from "vitest";
import {Timestamp} from "firebase-admin/firestore";
import {
  deleteMessageById,
  getMessageById,
} from "../../../models/data/message";

describe("saveMessage", () => {
  const authorId = "save_message_author_id";
  const messageIdNoMedia = "save_message_message_id_no_media";
  const messageIdWithImage = "save_message_message_id_with_image";
  const messageIdWithVideo = "save_message_message_id_with_video";
  const text = "save_message_message_text";
  const recipientId = "save_message_recipient_id";
  const recipientIds = [authorId, recipientId];
  const groupId = authorId + "_" + recipientId;

  async function cleanup() {
    await deleteMessageById(messageIdNoMedia);
    await deleteMessageById(messageIdWithImage);
    await deleteMessageById(messageIdWithVideo);
  }

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
    testCfg.cleanup();
  });

  describe("with valid auth and parameters, no media", () => {
    it("should save message", async () => {
      // Call the wrapped function.
      const wrapped = testCfg.wrap(saveMessage);
      const data = {
        id: messageIdNoMedia,
        text: text,
        recipientIds: recipientIds,
        groupId: groupId,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };
      const auth = {
        uid: authorId,
      };
      const req = {
        data: data,
        auth: auth,
      };
      const result = await wrapped(req);

      // Check for saved message.
      const message = await getMessageById(messageIdNoMedia);
      expect(message.id).to.eql(messageIdNoMedia);
      expect(message.text).to.eql(text);
      expect(message.recipientIds.length).to.eql(2);
      expect(message.groupId).to.eql(groupId);
      expect(message.media).to.be.empty;
      expect(result.success).to.eql(true);
    });
  });

  // describe("with valid auth and parameters, image attachment", () => {
  //   it("should save message", async () => {
  //     // Call the wrapped function.
  //     const wrapped = testCfg.wrap(saveMessage);
  //     const data = {
  //       id: messageIdWithImage,
  //       text: text,
  //       recipientIds: recipientIds,
  //       groupId: groupId,
  //       media: [
  //         {
  //           filename: "image_filename.jpg",
  //           data: "image_data",
  //           thumbnailData: "thumbnail_data",
  //         },
  //       ],
  //       createdAt: Timestamp.fromDate(new Date()),
  //       updatedAt: Timestamp.fromDate(new Date()),
  //     };
  //     const auth = {
  //       uid: authorId,
  //     };
  //     const req = {
  //       data: data,
  //       auth: auth,
  //     };
  //     const result = await wrapped(req);

  //     // Check for saved message.
  //     const message = await getMessageById(messageIdWithImage);
  //     expect(message.id).to.eql(messageIdWithImage);
  //     expect(message.text).to.eql(text);
  //     expect(message.recipientIds.length).to.eql(2);
  //     expect(message.groupId).to.eql(groupId);
  //     expect(message.media).to.not.be.empty;
  //     expect(result.success).to.eql(true);
  //   });
  // });

  // describe("with valid auth and parameters, video attachment", () => {
  //   it("should save message", async () => {
  //     // Call the wrapped function.
  //     const wrapped = testCfg.wrap(saveMessage);
  //     const data = {
  //       id: messageIdWithVideo,
  //       text: text,
  //       recipientIds: recipientIds,
  //       groupId: groupId,
  //       media: [
  //         {
  //           filename: "video_filename.mp4",
  //           data: "video_data",
  //           thumbnailData: "thumbnail_data",
  //         },
  //       ],
  //       createdAt: Timestamp.fromDate(new Date()),
  //       updatedAt: Timestamp.fromDate(new Date()),
  //     };
  //     const auth = {
  //       uid: authorId,
  //     };
  //     const req = {
  //       data: data,
  //       auth: auth,
  //     };
  //     const result = await wrapped(req);

  //     // Check for saved message.
  //     const message = await getMessageById(messageIdWithVideo);
  //     expect(message.id).to.eql(messageIdWithVideo);
  //     expect(message.text).to.eql(text);
  //     expect(message.recipientIds.length).to.eql(2);
  //     expect(message.groupId).to.eql(groupId);
  //     expect(message.media).to.not.be.empty;
  //     expect(result.success).to.eql(true);
  //   });
  // });
});
