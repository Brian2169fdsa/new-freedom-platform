// Set up Firebase testing.
import {ProjectConfig} from "../../../utilities/constants";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const testCfg = require("firebase-functions-test")({
  databaseURL: ProjectConfig.DATABASE_URL,
  storageBucket: ProjectConfig.STORAGE_BUCKET,
  projectId: ProjectConfig.PROJECT_ID,
}, "./src/tests/newfreedom_service_account_key.json");

// Set up requirements.
import {describe, beforeEach, afterEach, it, expect} from "vitest";
import {
  deleteModerationReportById,
  ModerationReport,
  setModerationReportById,
} from "../../../models/data/moderationReport";
import {generateMock} from "@anatine/zod-mock";
import {Timestamp} from "firebase-admin/firestore";
import {deletePostById, Post, setPostById} from "../../../models/data/post";
import {deleteUserById, setUserById, User} from "../../../models/data/user";
import {getPendingModerationReportId} from "../../../index";
import {getModerationReportId} from "../../../utilities/getModerationReportId";

describe("getPendingModerationReportId", () => {
  const userId = "pmrid_user_id";
  const postId = "7c04c9da-652e-4d1c-a512-732dca1c300f";
  const authorId = "author_id";
  const reportType = "report_type";
  const reportId = getModerationReportId(postId, userId);

  async function cleanup() {
    await deleteUserById(userId);
    await deletePostById(postId);
    await deleteModerationReportById(reportId);
  }

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
    testCfg.cleanup();
  });

  describe("with valid auth (as an admin)", () => {
    it("should return a moderation report id", async () => {
      // Create item in moderation reports.
      const reportData: ModerationReport = generateMock(ModerationReport, {
        stringMap: {
          contentId: () => postId,
          reportType: () => reportType,
          reportedBy: () => userId,
          source: () => "post",
          status: () => "pending",
        },
      });
      const anHourAgo = new Date();
      anHourAgo.setMinutes(anHourAgo.getMinutes() - 60);
      reportData.availableAt = Timestamp.fromDate(anHourAgo);
      reportData.createdAt = Timestamp.fromDate(new Date());
      reportData.updatedAt = Timestamp.fromDate(new Date());
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
      const wrapped = testCfg.wrap(getPendingModerationReportId);
      const data = {};
      const auth = {
        uid: userId,
      };
      const req = {
        data: data,
        auth: auth,
      };
      const result = await wrapped(req);

      // Check for moderation report id.
      expect(result.moderationReportId).to.eql(reportId);
    });
  });

  describe("with valid auth (as an admin), but no reports exist", () => {
    it("should return success", async () => {
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
      const wrapped = testCfg.wrap(getPendingModerationReportId);
      const data = {};
      const auth = {
        uid: userId,
      };
      const req = {
        data: data,
        auth: auth,
      };
      const result = await wrapped(req);

      // Check for success.
      expect(result.success).to.exist;
    });
  });
});
