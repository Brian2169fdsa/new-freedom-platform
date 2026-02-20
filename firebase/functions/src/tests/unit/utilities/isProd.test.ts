import {isProd} from "../../../utilities/isProd";
import {describe, it, expect} from "vitest";

describe("isProd", () => {
  describe("while running unit tests", () => {
    it("should return false", async () => {
      // Call the function.
      const result = isProd();

      // Check for result.
      expect(result).to.eql(false);
    });
  });
  describe("while running in prod env", () => {
    it("should return true", () => {
      process.env.NODE_ENV = "production";
      expect(isProd()).to.eql(true);
    });
  });
});
