// Set up Firebase testing.
import {ProjectConfig} from "../../../utilities/constants";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const testCfg = require("firebase-functions-test")({
  databaseURL: ProjectConfig.DATABASE_URL,
  storageBucket: ProjectConfig.STORAGE_BUCKET,
  projectId: ProjectConfig.PROJECT_ID,
}, "./src/tests/newfreedom_service_account_key.json");

// Set up requirements.
import {savePost} from "../../../index";
import {describe, beforeEach, afterEach, it, expect} from "vitest";
import {generateMock} from "@anatine/zod-mock";
import {
  deleteUserById,
  setUserById,
  User,
} from "../../../models/data/user";
import {Timestamp} from "firebase-admin/firestore";
import {
  deletePostById,
  getPostById,
  setPostById,
  Post,
} from "../../../models/data/post";
import {sleep} from "../../../utilities/sleep";

describe("savePost", () => {
  const authorId = "save_post_author_id";
  const authorDisplayName = "save_post_author_displayName";
  const authorProfilePicURL = "http://example.com/image.jpg";
  const postIdNoMedia = "save_post_post_id_no_media";
  const postIdWithImage = "save_post_post_id_with_image";
  const postIdWithVideo = "save_post_post_id_with_video";
  const postIDReplying = "save_post_post_id_replying";
  const postIDReplyingTo = "save_post_post_id_replying_to";
  const postReplyingToAuthorID = "post_being_replied_to_author_id";
  const source = "save_post_post_source";
  const text = "save_post_post_text";
  const title = "save_post_post_title";
  const messageboardLink = "save_post_post_messageboardLink";

  async function cleanup() {
    await deleteUserById(authorId);
    await deletePostById(postIdNoMedia);
    await deletePostById(postIdWithImage);
    await deletePostById(postIdWithVideo);
    await deletePostById(postIDReplying);
    await deletePostById(postIDReplyingTo);
  }

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
    testCfg.cleanup();
  });

  describe("with valid auth and parameters, no media", () => {
    it("should save post", async () => {
      // Create test post author user.
      const userData = generateMock(User, {
        stringMap: {
          id: () => authorId,
        },
      });
      userData.displayName = authorDisplayName;
      userData.profilePicURL = authorProfilePicURL;
      userData.createdAt = Timestamp.fromDate(new Date());
      userData.updatedAt = Timestamp.fromDate(new Date());
      await setUserById(authorId, userData);

      // Call the wrapped function.
      const wrapped = testCfg.wrap(savePost);
      const data = {
        id: postIdNoMedia,
        source: source,
        text: text,
        title: title,
        messageboardLink: messageboardLink,
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

      // Check for saved post.
      sleep(5000);
      const post = await getPostById(postIdNoMedia);
      expect(post.id).to.eql(postIdNoMedia);
      expect(post.source).to.eql(source);
      expect(post.text).to.eql(text);
      expect(post.title).to.eql(title);
      expect(post.messageboardLink).to.eql(messageboardLink);
      expect(post.authorDisplayName).to.eql(authorDisplayName);
      expect(post.authorProfilePicURL).to.eql(authorProfilePicURL);
      expect(post.media).to.be.empty;
      expect(result.success).to.eql(true);
    });
  });

  describe("with valid auth and parameters, image attachment", () => {
    it("should save post", async () => {
      // Create test post author user.
      const userData = generateMock(User, {
        stringMap: {
          id: () => authorId,
        },
      });
      userData.displayName = authorDisplayName;
      userData.profilePicURL = authorProfilePicURL;
      userData.createdAt = Timestamp.fromDate(new Date());
      userData.updatedAt = Timestamp.fromDate(new Date());
      await setUserById(authorId, userData);

      // Call the wrapped function.
      const wrapped = testCfg.wrap(savePost);
      const data = {
        id: postIdWithImage,
        source: source,
        text: text,
        title: title,
        media: [
          {
            filename: "image_filename.jpg",
            data: "image_data",
            thumbnailData: "thumbnail_data",
          },
        ],
        messageboardLink: messageboardLink,
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

      // Check for saved post.
      sleep(5000);
      const post = await getPostById(postIdWithImage);
      expect(post.id).to.eql(postIdWithImage);
      expect(post.source).to.eql(source);
      expect(post.text).to.eql(text);
      expect(post.title).to.eql(title);
      expect(post.messageboardLink).to.eql(messageboardLink);
      expect(post.authorDisplayName).to.eql(authorDisplayName);
      expect(post.authorProfilePicURL).to.eql(authorProfilePicURL);
      expect(post.media).to.not.be.empty;
      expect(result.success).to.eql(true);
    });
  });

  describe("with valid auth and parameters, video attachment", () => {
    it("should save post", async () => {
      // Create test post author user.
      const userData = generateMock(User, {
        stringMap: {
          id: () => authorId,
        },
      });
      userData.displayName = authorDisplayName;
      userData.profilePicURL = authorProfilePicURL;
      userData.createdAt = Timestamp.fromDate(new Date());
      userData.updatedAt = Timestamp.fromDate(new Date());
      await setUserById(authorId, userData);

      // Call the wrapped function.
      const wrapped = testCfg.wrap(savePost);
      const data = {
        id: postIdWithVideo,
        source: source,
        text: text,
        title: title,
        media: [
          {
            filename: "image_filename.mp4",
            data: "image_data",
            thumbnailData: "thumbnail_data",
          },
        ],
        messageboardLink: messageboardLink,
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

      // Check for saved post.
      sleep(5000);
      const post = await getPostById(postIdWithVideo);
      expect(post.id).to.eql(postIdWithVideo);
      expect(post.source).to.eql(source);
      expect(post.text).to.eql(text);
      expect(post.title).to.eql(title);
      expect(post.messageboardLink).to.eql(messageboardLink);
      expect(post.authorDisplayName).to.eql(authorDisplayName);
      expect(post.authorProfilePicURL).to.eql(authorProfilePicURL);
      expect(post.media).to.not.be.empty;
      expect(result.success).to.eql(true);
    });
  });

  describe("with valid auth and parameters, replying to another post", () => {
    it("should save post and update post being replied to", async () => {
      // Create test post author user.
      const userData = generateMock(User, {
        stringMap: {
          id: () => authorId,
          displayName: () => authorDisplayName,
        },
      });
      userData.profilePicURL = authorProfilePicURL;
      userData.createdAt = Timestamp.fromDate(new Date());
      userData.updatedAt = Timestamp.fromDate(new Date());
      await setUserById(authorId, userData);

      // Create post that is being replied to.
      const postData = generateMock(Post, {
        stringMap: {
          id: () => postIDReplyingTo,
          source: () => source,
          authorId: () => postReplyingToAuthorID,
          text: () => text,
          title: () => title,
        },
      });
      postData.replies = [] as string[];
      postData.createdAt = Timestamp.fromDate(new Date());
      postData.updatedAt = Timestamp.fromDate(new Date());
      await setPostById(postIDReplyingTo, postData);

      // Call the wrapped function.
      const wrapped = testCfg.wrap(savePost);
      const data = {
        id: postIDReplying,
        source: source,
        text: text,
        title: title,
        authorId: authorId,
        replyTo: postIDReplyingTo,
        messageboardLink: messageboardLink,
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

      // Check for saved post.
      sleep(5000);
      const post = await getPostById(postIDReplying);
      expect(post.id).to.eql(postIDReplying);
      expect(post.source).to.eql(source);
      expect(post.text).to.eql(text);
      expect(post.title).to.eql(title);
      expect(post.messageboardLink).to.eql(messageboardLink);
      expect(post.authorDisplayName).to.eql(authorDisplayName);
      expect(post.authorProfilePicURL).to.eql(authorProfilePicURL);
      expect(post.media).to.be.empty;

      // Check for updated post being replied to.
      const replyToPost = await getPostById(postIDReplyingTo);
      expect(replyToPost.replies[0]).to.eql(postIDReplying);
      expect(replyToPost.authorId).to.eql(postReplyingToAuthorID);
      expect(result.success).to.eql(true);
    });
  });
});
