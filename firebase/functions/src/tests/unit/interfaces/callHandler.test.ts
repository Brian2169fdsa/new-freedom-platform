import {expect, it, describe} from "vitest";
import {callHandler} from "../../../interfaces/callHandler";
import {ArchivePostReq} from "../../../models/request/archivePostReq";
import {RequestConfig} from "../../../interfaces/requestConfig";
import {ResponseBase} from "../../../interfaces/responseBase";
import {Post} from "../../../models/data/post";
import {CallableRequest} from "firebase-functions/lib/common/providers/https";
import {ProjectConfig} from "../../../utilities/constants";
import {
  AppendableHttpsError, InvalidArgumentError,
  NotAuthenticatedError,
} from "../../../utilities/errors";
import {generateMock} from "@anatine/zod-mock";
import {ZodError} from "zod";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const testCfg = require("firebase-functions-test")({
  databaseURL: ProjectConfig.DATABASE_URL,
  storageBucket: ProjectConfig.STORAGE_BUCKET,
  projectId: ProjectConfig.PROJECT_ID,
}, "./src/tests/newfreedom_service_account_key.json");

describe("callHandler", () => {
  describe("throwing unknown error", () => {
    it("should throw internal error", async () => {
      const cfg: RequestConfig<typeof ArchivePostReq, ResponseBase> = {
        name: "test",
        schema: ArchivePostReq,
      };
      const handler = callHandler(cfg, async (_, __) => {
        throw new Error("unknown error");
      });
      const wrapped = testCfg.wrap(handler);
      const req: CallableRequest = {} as CallableRequest<unknown>;
      await expect(() => wrapped(req, {}))
        .rejects.toThrowError(AppendableHttpsError);
    });
  });

  describe("throwing appendable https error", () => {
    it("should throw appendable https error", async () => {
      const cfg: RequestConfig<typeof ArchivePostReq, ResponseBase> = {
        name: "test",
        schema: ArchivePostReq,
      };
      const handler = callHandler(cfg, async (_, __) => {
        throw NotAuthenticatedError;
      });
      const wrapped = testCfg.wrap(handler);
      const post = {data: generateMock(Post)};
      await expect(() => wrapped(post, {}))
        .rejects.toThrowError(AppendableHttpsError);
    });
  });

  async function testUnAuthedError(
    throwVal: Error|null,
    expected: typeof AppendableHttpsError|string
  ) {
    const cfg: RequestConfig<typeof ArchivePostReq, ResponseBase> = {
      name: "test",
      contextOptions: {
        withAuthUserId: false,
        withRole: "UNUSED",
        includeUser: false,
      },
      schema: ArchivePostReq,
    };
    const handler = callHandler(cfg, async (_, __) => {
      throw throwVal;
    });
    const wrapped = testCfg.wrap(handler);
    const post = {data: generateMock(Post)};
    await expect(() => wrapped(post, {}))
      .rejects.toThrowError(expected);
  }

  describe("throwing zod error", () => {
    it("should throw invalid argument", async () => {
      await testUnAuthedError(
        new ZodError([]), InvalidArgumentError.message + " : test");
    });
  });

  describe("throwing unknown error", () => {
    it("should throw unknown error", async () => {
      await testUnAuthedError(new Error("unknown"), AppendableHttpsError);
    });
  });

  describe("throwing null", () => {
    it("should throw unknown error", async () => {
      await testUnAuthedError(null, AppendableHttpsError);
    });
  });
});
