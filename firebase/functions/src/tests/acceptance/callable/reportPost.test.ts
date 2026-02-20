// Set up Firebase testing.
import {ProjectConfig} from "../../../utilities/constants";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const testCfg = require("firebase-functions-test")({
  databaseURL: ProjectConfig.DATABASE_URL,
  storageBucket: ProjectConfig.STORAGE_BUCKET,
  projectId: ProjectConfig.PROJECT_ID,
}, "./src/tests/newfreedom_service_account_key.json");

// Set up requirements.
import {reportPost} from "../../../index";
import {describe, beforeEach, afterEach, it, expect} from "vitest";
import {
  deleteModerationReportById,
  getModerationReportById,
} from "../../../models/data/moderationReport";
import {Timestamp} from "firebase-admin/firestore";
import {getModerationReportId} from "../../../utilities/getModerationReportId";

describe("reportPost", () => {
  const userId = "report_post_user_id";
  const reportType = "report_post_report_type";
  const contentId = "report_post_content_id";
  const reportId = getModerationReportId(contentId, userId);

  async function cleanup() {
    await deleteModerationReportById(reportId);
  }

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
    testCfg.cleanup();
  });

  describe("with valid auth and parameters", () => {
    it("should save moderation report", async () => {
      // Call the wrapped function.
      const wrapped = testCfg.wrap(reportPost);
      const data = {
        id: contentId,
        reportType: reportType,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };
      const auth = {
        uid: userId,
      };
      const req = {
        data: data,
        auth: auth,
      };
      const result = await wrapped(req);

      // Check for saved moderation report.
      const report = await getModerationReportById(reportId);
      expect(report.id).to.eql(reportId);
      expect(report.contentId).to.eql(contentId);
      expect(report.reportType).to.eql(reportType);
      expect(report.reportedBy).to.eql(userId);
      expect(report.status).to.eql("pending");
      expect(report.action).to.eql("pending");
      expect(result.success).to.eql(true);
    });
  });
});
