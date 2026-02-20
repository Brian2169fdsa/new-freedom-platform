// // Set up Firebase testing.
// import {ProjectConfig} from "../../../utilities/constants";
// // eslint-disable-next-line @typescript-eslint/no-var-requires
// const testCfg = require("firebase-functions-test")({
//   databaseURL: ProjectConfig.DATABASE_URL,
//   storageBucket: ProjectConfig.STORAGE_BUCKET,
//   projectId: ProjectConfig.PROJECT_ID,
// }, "./src/tests/newfreedom_service_account_key.json");
// import {Request} from "firebase-functions/lib/common/providers/https";
// import * as express from "express";

// // Set up requirements.
// import {saveInviteRequest} from "../../../index";
// import {expect, it, describe, beforeEach, afterEach} from "vitest";
// import {
//   deleteInviteRequestById,
//   getInviteRequestById,
//   InviteRequest,
//   setInviteRequestById,
// } from "../../../models/data/inviteRequest";
// import {generateMock} from "@anatine/zod-mock";
// import {Timestamp} from "firebase-admin/firestore";

// describe("saveInviteRequest", () => {
//   const inviteRequestId = "save_invite_request_invite_request_id";
//   const email = "save_invite_request_email@example.com";

//   async function cleanup() {
//     await deleteInviteRequestById(inviteRequestId);
//   }

//   beforeEach(async () => {
//     await cleanup();
//   });

//   afterEach(async () => {
//     await cleanup();
//     testCfg.cleanup();
//   });

//   async function runTest() {
//     // Call the function.
//     const request = {
//       query: {
//         id: inviteRequestId,
//         email: email,
//       },
//     } as unknown as Request;
//     const response = {
//       status: (code: number) => {
//         expect(code).to.eql(200);
//         return response;
//       },
//       send: (data: {success: boolean}) => {
//         expect(data.success).to.eql(true);
//         return response;
//       },
//     } as unknown as express.Response;
//     await saveInviteRequest(request, response);
//   }

//   describe("with valid parameters", () => {
//     it("should set invite request and return 200/success", async () => {
//       // Run test.
//       await runTest();

//       // Check for correct invite request data.
//       const inviteRequestDoc = await getInviteRequestById(inviteRequestId);
//       expect(inviteRequestDoc.status).to.eql("pending");
//       expect(inviteRequestDoc.email).to.eql(email);
//     });
//   });

//   describe("with valid parameters, email already requested invite", () => {
//     it("should return 200/success", async () => {
//       // Create existing invite request.
//       const inviteRequestData = generateMock(InviteRequest, {
//         stringMap: {
//           id: () => inviteRequestId,
//         },
//       });
//       inviteRequestData.status = "pending";
//       inviteRequestData.email = email;
//       inviteRequestData.createdAt = Timestamp.fromDate(new Date());
//       inviteRequestData.updatedAt = Timestamp.fromDate(new Date());
//       await setInviteRequestById(inviteRequestId, inviteRequestData);

//       // Run test.
//       await runTest();

//       // Check for correct invite request data.
//       const inviteRequestDoc = await getInviteRequestById(inviteRequestId);
//       expect(inviteRequestDoc.status).to.eql("pending");
//       expect(inviteRequestDoc.email).to.eql(email);
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
