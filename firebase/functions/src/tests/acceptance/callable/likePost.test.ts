// Set up Firebase testing.
import {ProjectConfig} from "../../../utilities/constants";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const testCfg = require("firebase-functions-test")({
  databaseURL: ProjectConfig.DATABASE_URL,
  storageBucket: ProjectConfig.STORAGE_BUCKET,
  projectId: ProjectConfig.PROJECT_ID,
}, "./src/tests/newfreedom_service_account_key.json");

// Set up requirements.
import {likePost} from "../../../index";
import {describe, beforeEach, afterEach, it, expect} from "vitest";
import {generateMock} from "@anatine/zod-mock";
import {
  deletePostById,
  getPostById,
  Post,
  setPostById,
} from "../../../models/data/post";
import {
  deleteUserById,
  getUserById,
  setUserById,
  User,
} from "../../../models/data/user";
import {Timestamp} from "firebase-admin/firestore";

describe("likePost", () => {
  const userId = "like_post_user_id";
  const postId = "like_post_post_id";
  const postAuthorId = "like_post_post_author_id";

  async function cleanup() {
    await deleteUserById(postAuthorId);
    await deletePostById(postId);
  }

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
    testCfg.cleanup();
  });

  describe("with valid auth and parameters", () => {
    it("should update post likedBy and author user likeCount", async () => {
      // Create test post.
      const postData = generateMock(Post, {
        stringMap: {
          id: () => postId,
          authorId: () => postAuthorId,
        },
      });
      postData.likedBy = [];
      postData.createdAt = Timestamp.fromDate(new Date());
      postData.updatedAt = Timestamp.fromDate(new Date());
      await setPostById(postId, postData);

      // Create test post author user.
      const authorData = generateMock(User, {
        stringMap: {
          id: () => postAuthorId,
        },
      });
      authorData.likeCount = 0;
      authorData.createdAt = Timestamp.fromDate(new Date());
      authorData.updatedAt = Timestamp.fromDate(new Date());
      await setUserById(postAuthorId, authorData);

      // Call the wrapped function.
      const wrapped = testCfg.wrap(likePost);
      const data = {
        id: postId,
      };
      const auth = {
        uid: userId,
      };
      const req = {
        data: data,
        auth: auth,
      };
      const result = await wrapped(req);

      // Check for updated post likedBy.
      const post = await getPostById(postId);
      expect(post.likedBy[0]).to.eql(userId);
      // Check for updated post author likeCount.
      const author = await getUserById(postAuthorId);
      expect(author.likeCount).to.eql(1);
      expect(result.success).to.eql(true);
    });
  });

  describe("with valid auth and parameters, author+post exist", () => {
    it("should update post likedBy and author user likeCount", async () => {
      // Create test post with an existing likedBy.
      const postData = generateMock(Post, {
        stringMap: {
          id: () => postId,
          authorId: () => postAuthorId,
        },
      });
      postData.likedBy = ["another_user"];
      postData.createdAt = Timestamp.fromDate(new Date());
      postData.updatedAt = Timestamp.fromDate(new Date());
      await setPostById(postId, postData);

      // Create test post author user with an existing likedBy.
      const authorData = generateMock(User, {
        stringMap: {
          id: () => postAuthorId,
        },
      });
      authorData.likeCount = 1;
      authorData.createdAt = Timestamp.fromDate(new Date());
      authorData.updatedAt = Timestamp.fromDate(new Date());
      await setUserById(postAuthorId, authorData);

      // Call the wrapped function.
      const wrapped = testCfg.wrap(likePost);
      const data = {
        id: postId,
      };
      const auth = {
        uid: userId,
      };
      const req = {
        data: data,
        auth: auth,
      };
      const result = await wrapped(req);

      // Check for updated post likedBy.
      const post = await getPostById(postId);
      expect(post.likedBy[1]).to.eql(userId);
      // Check for updated post author likeCount.
      const author = await getUserById(postAuthorId);
      expect(author.likeCount).to.eql(2);
      expect(result.success).to.eql(true);
    });
  });
});
