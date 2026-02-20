import {describe, expect, it} from "vitest";
import {MeRes} from "../../../../models/request/meRes";
import {generateMock} from "@anatine/zod-mock";

describe("meRes", () => {
  it("should be defined", async () => {
    const meRes = generateMock(MeRes);
    !expect(meRes).to.not.be.null;
  });
});
