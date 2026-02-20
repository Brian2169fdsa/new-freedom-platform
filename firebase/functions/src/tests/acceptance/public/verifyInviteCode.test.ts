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
// import {verifyInviteCode} from "../../../index";
// import {expect, it, describe, beforeEach, afterEach} from "vitest";
// import {
//   deleteInviteById,
//   getInviteById,
//   Invite, setInviteById,
// } from "../../../models/data/invite";
// import {generateMock} from "@anatine/zod-mock";
// import {Timestamp} from "firebase-admin/firestore";

// describe("verifyInviteCode", () => {
//   const userId = "user_id";
//   const newInviteId = "invite_id";
//   const usedInviteId = "previously_used_invite_id";

//   async function cleanup() {
//     await deleteInviteById(newInviteId);
//     await deleteInviteById(usedInviteId);
//   }

//   beforeEach(async () => {
//     await cleanup();
//   });

//   afterEach(async () => {
//     await cleanup();
//     testCfg.cleanup();
//   });

//   async function runTest(
//     inviteId: string,
//     userId: string,
//     inviteData: Invite
//   ) {
//     inviteData.createdAt = Timestamp.fromDate(new Date());
//     inviteData.updatedAt = Timestamp.fromDate(new Date());
//     await setInviteById(newInviteId, inviteData);

//     // Call the function.
//     const request = {
//       query: {
//         inviteCode: newInviteId,
//       },
//       headers: { origin: true },
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
//       on: (event: string, callback: Function) => {
//         if (event === "finish") {
//           callback();
//         }
//       },
//     } as unknown as express.Response;
//     await verifyInviteCode(request, response);
//     const resultInvite = await getInviteById(newInviteId);
//     return resultInvite;
//   }

//   describe("with valid parameters, fresh invite", () => {
//     it("should set invite useCount 1 and return 200/success", async () => {
//       // Create test invite, fresh.
//       const inviteData = generateMock(Invite, {stringMap: {
//         id: () => newInviteId,
//         inviteCode: () => newInviteId,
//         authorId: () => "author",
//       }});
//       inviteData.useCount = 0;
//       const invite = await runTest(newInviteId, userId, inviteData);
//       expect(invite.useCount).to.eql(1);
//     });
//   });
/*
  describe("with valid parameters, previously-used invite", () => {
    it("should increment invite useCount and return 200/success", async () => {
      // Create test invite, previously-used.
      const useCount = Math.floor(Math.random() * 100);

      const inviteData = generateMock(Invite, {stringMap: {
        id: () => usedInviteId,
        inviteCode: () => usedInviteId,
        authorId: () => "author",
      }});
      inviteData.useCount = useCount;
      const invite = await runTest(usedInviteId, userId, inviteData);
      expect(invite.useCount).to.eql(useCount+1);
    });
  });
*/
// });

import {describe, it, expect} from "vitest"; // TODO: REMOVE
describe("empty test", () => {
  it("should do nothing", async () => {
    const nothing = 0;
    expect(nothing).to.eql(0);
  });
});
