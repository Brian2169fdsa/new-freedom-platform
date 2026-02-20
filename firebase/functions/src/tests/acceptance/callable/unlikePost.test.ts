// Set up Firebase testing.
import {ProjectConfig, POSTS_COLLECTION, USERS_COLLECTION}
  from "../../../utilities/constants";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const testCfg = require("firebase-functions-test")({
  databaseURL: ProjectConfig.DATABASE_URL,
  storageBucket: ProjectConfig.STORAGE_BUCKET,
  projectId: ProjectConfig.PROJECT_ID,
}, "./src/tests/newfreedom_service_account_key.json");
import {describe, beforeEach, afterEach, it, expect} from "vitest";
import {User, deleteUserById, getUserById} from "../../../models/data/user";
import {Post, deletePostById, getPostById} from "../../../models/data/post";
import {generateMock} from "@anatine/zod-mock";
import {setDocument} from "../../../utilities/setDocument";
import {unlikePost} from "../../../index";

describe("unlikePost", () => {
  const userId = "unlike_post_user_id";
  const postId = "unlike_post_post_id";
  const authorId = "unlike_post_author_id";
  const authorLikeCount = 99;

  async function cleanup() {
    await deleteUserById(authorId);
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
      // Create test author.
      const authorData = generateMock(User, {stringMap: {id: () => authorId}});
      authorData.likeCount = authorLikeCount;
      await setDocument(USERS_COLLECTION, authorId, authorId, authorData);

      // Create test post.
      const postData = generateMock(Post, {stringMap: {id: () => postId}});
      postData.likedBy = [userId];
      postData.authorId = authorId;
      await setDocument(POSTS_COLLECTION, postId, postId, postData);

      // Call the wrapped function.
      const wrapped = testCfg.wrap(unlikePost);
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

      // Check for updated post.
      const post = await getPostById(postId);
      expect(post.likedBy).to.not.contain(userId);

      // Check for updated author.
      const author = await getUserById(authorId);
      expect(author.likeCount).to.eql(authorLikeCount-1);
      expect(result.success).to.eql(true);
    });
  });
});
