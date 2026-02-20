import {callHandler} from "../interfaces/callHandler";
import {RequestConfig} from "../interfaces/requestConfig";
import {ResponseBase, Success} from "../interfaces/responseBase";
import {UpdateUserReq} from "../models/request/updateUserReq";
import {updateUserById} from "../models/data/user";

const config: RequestConfig<typeof UpdateUserReq, ResponseBase> = {
  name: "updateUser",
  schema: UpdateUserReq,
};

/**
 * Updates a user's profile data.
 */
export const updateUser = callHandler(config, async (request, ctx) => {
  // Get data.
  const userId = ctx.authUserId;
  const {anonymous} = request;
  const {allowPhoneContact} = request;
  const {displayName} = request;
  const {firstName} = request;
  const {lastName} = request;
  const {email} = request;
  const {phone} = request;

  // Save user.
  await updateUserById(userId, {
    anonymous: anonymous,
    allowPhoneContact: allowPhoneContact,
    displayName: displayName,
    firstName: firstName,
    lastName: lastName,
    email: email,
    phone: phone,
  });

  return Success;
});
