import {it, describe, expect} from "vitest";
import {validateOrThrow} from "../../../utilities/validateOrThrow";
import {NotAuthenticatedError} from "../../../utilities/errors";

describe("validateOrThrow", () => {
  it("should throw when condition is false ", () => {
    expect(() => validateOrThrow(false, NotAuthenticatedError)).toThrow();
  });
});
