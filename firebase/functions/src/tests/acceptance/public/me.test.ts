// // Set up Firebase testing.
// import {ProjectConfig} from "../../../utilities/constants.js";
// // eslint-disable-next-line @typescript-eslint/no-var-requires
// const testCfg = require("firebase-functions-test")({
//   databaseURL: ProjectConfig.DATABASE_URL,
//   storageBucket: ProjectConfig.STORAGE_BUCKET,
//   projectId: ProjectConfig.PROJECT_ID,
// }, "./src/tests/newfreedom_service_account_key.json");

// // Set up requirements.
// import {me} from "../../../index";
// import {describe, beforeEach, afterEach, it, expect} from "vitest";
// import {deleteUserById, setUserById, User} from "../../../models/data/user";
// import {generateMock} from "@anatine/zod-mock";
// import {MeRes} from "../../../models/request/meRes";
// import {Timestamp} from "firebase-admin/firestore";

// describe("me", () => {
//   const userId = "user_id";
//   const email ="user_email@email.com";
//   const firstName = "user_first_name";
//   const lastName = "user_last_name";
//   const security = {subspace: "positionofneutrality"};

//   beforeEach(async () => {
//     await deleteUserById(userId);
//   });

//   afterEach(async () => {
//     await deleteUserById(userId);
//     testCfg.cleanup();
//   });

//   describe("with valid parameters", () => {
//     it("should return user information", async () => {
//       // Create test user.
//       const docData = generateMock(User, {
//         stringMap: {
//           id: () => userId,
//           email: () => email,
//           firstName: () => firstName,
//           lastName: () => lastName,
//         },
//       });
//       docData.createdAt = Timestamp.fromDate(new Date());
//       docData.updatedAt = Timestamp.fromDate(new Date());
//       await setUserById(userId, docData);

//       // Call the function.
//       const request = {
//         query: {
//           token: userId,
//         },
//       };
//       const response = {
//         status: (code: number) => {
//           expect(code).to.eql(200);
//           return response;
//         },
//         send: (data: MeRes) => {
//           expect(data.email).to.eql(email);
//           expect(data.firstName).to.eql(firstName);
//           expect(data.lastName).to.eql(lastName);
//           expect(data.security).to.eql(security);
//           return response;
//         },
//       };
//       // @ts-ignore
//       await me(request, response);
//     });
//   });

//   describe("with invalid parameters", () => {
//     it("should return 401", async () => {
//       // Check for failure.
//       const request = {
//         query: {},
//       };
//       const response = {
//         status: (code: number) => {
//           expect(code).to.eql(400);
//           return response;
//         },
//         send: (data: MeRes) => {
//           return response;
//         },
//       };
//       // @ts-ignore
//       await me(request, response);
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
