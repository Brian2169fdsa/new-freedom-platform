import {describe, expect, it} from "vitest";
import {setDocument} from "../../../utilities/setDocument";
import {POSTS_COLLECTION} from "../../../utilities/constants";
import {fieldMustBeStringError} from "../../../utilities/errors";

describe("setDocument", () => {
  it("should throw when documentId is length 0", async () => {
    await expect(() => setDocument(
      POSTS_COLLECTION, "", "ownerId", {id: "id", ownerId: "ownerId"}))
      .rejects.toThrowError(fieldMustBeStringError("documentId"));
  });
  it("should throw when ownerId is length 0", async () => {
    await expect(() => setDocument(
      POSTS_COLLECTION, "docId", "", {id: "id", ownerId: "ownerId"}))
      .rejects.toThrowError(fieldMustBeStringError("ownerId"));
  });
});
