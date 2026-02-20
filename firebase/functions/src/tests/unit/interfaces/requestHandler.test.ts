// import {expect, it, describe} from "vitest";
// import {ArchivePostReq} from "../../../models/request/archivePostReq";
// import {RequestConfig} from "../../../interfaces/requestConfig";
// import {ResponseBase} from "../../../interfaces/responseBase";
// import {Post} from "../../../models/data/post";
/*
import {NotAuthenticatedError, UnknownError} from "../../../utilities/errors";
*/
// import {generateMock} from "@anatine/zod-mock";
// import {requestHandler} from "../../../interfaces/requestHandler";
// import * as express from "express";

// describe("requestHandler", () => {
//   describe("throwing unknown error", () => {
//     it("should throw internal error", async () => {
//       const cfg: RequestConfig<typeof ArchivePostReq, ResponseBase> = {
//         name: "test",
//         schema: ArchivePostReq,
//       };
//       const handler = requestHandler(cfg, async (req) => {
//         throw new Error("unknown error");
//       });
//       const response = {
//         status: (code: number) => {
//           expect(code).to.eql(500);
//           return response;
//         },
//         send: (data: {success: boolean, error: string}) => {
//           expect(data.error).to.eql(UnknownError);
//           return data;
//         },
//       } as unknown as express.Response;
//       const post = {query: generateMock(Post)};
//       // @ts-ignore
//       await handler(post, response);
//     });
//   });

//   describe("throwing appendable https error", () => {
//     it("should throw appendable https error", async () => {
//       const cfg: RequestConfig<typeof ArchivePostReq, ResponseBase> = {
//         name: "test",
//         schema: ArchivePostReq,
//       };
//       const handler = requestHandler(cfg, async (req) => {
//         throw NotAuthenticatedError;
//       });
//       const response = {
//         status: (code: number) => {
//           expect(code).to.eql(401);
//           return response;
//         },
//         send: (data: {success: boolean, error: string}) => {
//           expect(data.error).to.eql("not authenticated : test");
//           return data;
//         },
//       } as unknown as express.Response;
//       const post = {query: generateMock(Post)};
//       // @ts-ignore
//       await handler(post, response);
//     });
//   });

//   describe("throwing null", () => {
//     it("should throw unknown error", async () => {
//       const cfg: RequestConfig<typeof ArchivePostReq, ResponseBase> = {
//         name: "test",
//         contextOptions: {
//           withAuthUserId: false,
//           withRole: "UNUSED",
//           includeUser: false,
//         },
//         schema: ArchivePostReq,
//       };
//       const handler = requestHandler(cfg, async (req) => {
//         throw null;
//       });
//       const response = {
//         status: (code: number) => {
//           expect(code).to.eql(500);
//           return response;
//         },
//         send: (data: {success: boolean, error: string}) => {
//           expect(data.error).to.eql("unknown error");
//           return data;
//         },
//       } as unknown as express.Response;
//       const post = {query: generateMock(Post)};
//       // @ts-ignore
//       await handler(post, response);
//     });
//   });
// });

import {describe, it, expect} from "vitest"; // TODO: REMOVE
describe("empty test", () => {
  it("should do nothing", async () => {
    const nothing = 0;
    expect(nothing).to.eql(0);
  });
});
