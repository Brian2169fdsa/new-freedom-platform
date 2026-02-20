import {describe, it, expect} from "vitest";
import {getAuthUserIdOrThrow} from "../../../utilities/getAuthUserIdOrThrow";
import {NotAuthenticatedError} from "../../../utilities/errors";

describe("getAuthUserIdOrThrow", () => {
  it("should throw when auth uid length <= 0", () => {
    expect(() => getAuthUserIdOrThrow({
      data: {},
      // @ts-ignore
      rawRequest: {},
      auth: {
        uid: "",
        // @ts-ignore
        token: {},
      }})).toThrow(NotAuthenticatedError);
  });
});
