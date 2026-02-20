// Set up Firebase testing.
import {ProjectConfig, USERS_COLLECTION} from "../../../utilities/constants";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const testCfg = require("firebase-functions-test")({
  databaseURL: ProjectConfig.DATABASE_URL,
  storageBucket: ProjectConfig.STORAGE_BUCKET,
  projectId: ProjectConfig.PROJECT_ID,
}, "./src/tests/newfreedom_service_account_key.json");
import {describe, beforeEach, afterEach, it, expect} from "vitest";
import {deleteUserById, getUserById, User} from "../../../models/data/user";
import {generateMock} from "@anatine/zod-mock";
import {setDocument} from "../../../utilities/setDocument";
import {updateUser} from "../../../index";
import {Timestamp} from "firebase-admin/firestore";

describe("updateUser", () => {
  const userId = "update_user_id";
  const anonymous = false;
  const updatedAnonymous = true;
  const allowPhoneContact = false;
  const updatedAllowPhoneContact = true;
  const displayName = "display_name";
  const updatedDisplayName = "updated_display_name";
  const firstName = "first_name";
  const updatedFirstName = "updated_first_name";
  const lastName = "last_name";
  const updatedLastName = "updated_last_name";
  const email = "email_@domain.com";
  const updatedEmail = "updated_email@domain.com";
  const phone = "111-111-1111";
  const updatedPhone = "222-222-2222";

  async function cleanup() {
    await deleteUserById(userId);
  }
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
    testCfg.cleanup();
  });

  describe("with valid auth and parameters", () => {
    it("should update user", async () => {
      // Create test user.
      const userData = generateMock(User, {stringMap: {id: () => userId}});
      userData.anonymous = anonymous;
      userData.allowPhoneContact = allowPhoneContact;
      userData.displayName = displayName;
      userData.firstName = firstName;
      userData.lastName = lastName;
      userData.email = email;
      userData.phone = phone;
      userData.createdAt = Timestamp.fromDate(new Date());
      userData.updatedAt = Timestamp.fromDate(new Date());
      await setDocument(USERS_COLLECTION, userId, userId, userData);

      // Call the wrapped function.
      const wrapped = testCfg.wrap(updateUser);
      const data = {
        anonymous: updatedAnonymous,
        allowPhoneContact: updatedAllowPhoneContact,
        displayName: updatedDisplayName,
        firstName: updatedFirstName,
        lastName: updatedLastName,
        email: updatedEmail,
        phone: updatedPhone,
      };
      const auth = {
        uid: userId,
      };
      const req = {
        data: data,
        auth: auth,
      };
      const result = await wrapped(req);

      // Check for updated user.
      const user = await getUserById(userId);
      expect(user.anonymous).to.eql(updatedAnonymous);
      expect(user.allowPhoneContact).to.eql(updatedAllowPhoneContact);
      expect(user.displayName).to.eql(updatedDisplayName);
      expect(user.firstName).to.eql(updatedFirstName);
      expect(user.lastName).to.eql(updatedLastName);
      expect(user.email).to.eql(updatedEmail);
      expect(user.phone).to.eql(updatedPhone);
      expect(result.success).to.eql(true);
    });
  });
});
