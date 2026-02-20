// Set up Firebase testing.
import {ProjectConfig} from "../../../utilities/constants";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const testCfg = require("firebase-functions-test")({
  databaseURL: ProjectConfig.DATABASE_URL,
  storageBucket: ProjectConfig.STORAGE_BUCKET,
  projectId: ProjectConfig.PROJECT_ID,
}, "./src/tests/newfreedom_service_account_key.json");

// Set up requirements.
import {moderatePost} from "../../../index";
import {describe, beforeEach, afterEach, it, expect} from "vitest";
import {
  deleteModerationReportById, getModerationReportById,
  ModerationReport,
  setModerationReportById,
} from "../../../models/data/moderationReport";
import {getModerationReportId} from "../../../utilities/getModerationReportId";
import {
  deletePostById,
  getPostById,
  Post,
  setPostById,
} from "../../../models/data/post";
import {deleteUserById, setUserById, User} from "../../../models/data/user";
import {generateMock} from "@anatine/zod-mock";
import {Timestamp} from "firebase-admin/firestore";

describe("moderatePost", () => {
  const userId = "moderate_post_user_id";
  const postId = "7aa4c9da-652e-4d1c-a512-732dca1c300f";
  const authorId = "moderate_post_author_id";
  const reportType = "moderate_post_report_type";
  const reportId = getModerationReportId(postId, userId);

  async function cleanup() {
    await deleteModerationReportById(reportId);
    await deletePostById(postId);
    await deleteUserById(userId);
  }

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
    testCfg.cleanup();
  });

  describe("with valid auth (as an admin), archiving the post", () => {
    it("should archive the post and update the report", async () => {
      const action = "archive";
      // Create item in moderation reports.
      const reportData = generateMock(ModerationReport, {
        stringMap: {
          ownerId: () => userId,
          contentId: () => postId,
          reportType: () => reportType,
          reportedBy: () => userId,
          source: () => "post",
          status: () => "pending",
        },
      });
      reportData.createdAt = Timestamp.fromDate(new Date());
      reportData.updatedAt = Timestamp.fromDate(new Date());
      reportData.availableAt = Timestamp.fromDate(new Date());
      await setModerationReportById(reportId, reportData);

      // Create test post.
      const postData = generateMock(Post, {
        stringMap: {
          id: () => postId,
          authorId: () => authorId,
        },
      });
      postData.createdAt = Timestamp.fromDate(new Date());
      postData.updatedAt = Timestamp.fromDate(new Date());
      await setPostById(postId, postData);

      // Create requester admin user.
      const user = generateMock(User, {
        stringMap: {
          id: () => userId,
        },
      });
      user.role = "admin";
      user.createdAt = Timestamp.fromDate(new Date());
      user.updatedAt = Timestamp.fromDate(new Date());
      await setUserById(userId, user);

      // Call the wrapped function as an admin.
      const wrapped = testCfg.wrap(moderatePost);
      const data = {
        id: reportId,
        action: action,
      };
      const auth = {
        uid: userId,
      };
      const req = {
        data: data,
        auth: auth,
      };
      await wrapped(req);
      // Check for archived post and moderation report updated.
      const post = await getPostById(postId);
      expect(post.archived).to.eql(true);
      const report = await getModerationReportById(reportId);
      expect(report.status).to.eql("completed");
      expect(report.action).to.eql(action);
    });
  });

  describe("with valid auth (as an admin), allowing the post", () => {
    it("should only update the report", async () => {
      const action = "allow";
      // Create item in moderation reports.
      const reportData = generateMock(ModerationReport, {
        stringMap: {
          ownerId: () => userId,
          contentId: () => postId,
          reportType: () => reportType,
          reportedBy: () => userId,
          source: () => "post",
          status: () => "pending",
        },
      });
      reportData.createdAt = Timestamp.fromDate(new Date());
      reportData.updatedAt = Timestamp.fromDate(new Date());
      reportData.availableAt = Timestamp.fromDate(new Date());
      await setModerationReportById(reportId, reportData);

      // Create test post.
      const postData = generateMock(Post, {
        stringMap: {
          id: () => postId,
          authorId: () => authorId,
        },
      });
      postData.archived = false;
      postData.createdAt = Timestamp.fromDate(new Date());
      postData.updatedAt = Timestamp.fromDate(new Date());
      await setPostById(postId, postData);

      // Create requester admin user.
      const user = generateMock(User, {
        stringMap: {
          id: () => userId,
        },
      });
      user.role = "admin";
      user.createdAt = Timestamp.fromDate(new Date());
      user.updatedAt = Timestamp.fromDate(new Date());
      await setUserById(userId, user);

      // Call the wrapped function as an admin.
      const wrapped = testCfg.wrap(moderatePost);
      const data = {
        id: reportId,
        action: action,
      };
      const auth = {
        uid: userId,
      };
      const req = {
        data: data,
        auth: auth,
      };
      await wrapped(req);
      // Check for non-archived post and moderation report updated.
      const post = await getPostById(postId);
      expect(post.archived).to.satisfy(
        (value: boolean) => value === undefined || value === false,
      );
      const report = await getModerationReportById(reportId);
      expect(report.status).to.eql("completed");
      expect(report.action).to.eql(action);
    });
  });
});
