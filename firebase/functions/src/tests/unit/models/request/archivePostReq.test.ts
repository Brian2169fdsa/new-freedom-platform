import {ArchivePostReq} from "../../../../models/request/archivePostReq";
import {ZodError} from "zod";
import {expect, it, describe} from "vitest";

describe("archiveDocReq", () => {
  it("should fail check when not an obj", () => {
    const req = 123;
    expect(() => ArchivePostReq.parse(req)).toThrow(ZodError);
  });
  it("should fail check with invalid id", () => {
    const req = {
      collection: "collection",
      id: 123,
    };
    expect(() => ArchivePostReq.parse(req)).toThrow(ZodError);
  });
  it("should fail check with empty id", () => {
    const req = {
      collection: "collection",
      id: "",
    };
    expect(() => ArchivePostReq.parse(req)).toThrow(ZodError);
  });
  it("should fail check with missing id", () => {
    const req = {
      collection: "collection",
    };
    expect(() => ArchivePostReq.parse(req)).toThrow(ZodError);
  });
  it("should pass check with valid values", () => {
    const req = {
      id: "id",
    };
    expect(() => ArchivePostReq.parse(req)).to.not.throw();
  });
});
