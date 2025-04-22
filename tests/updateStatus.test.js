/**
 * @jest-environment jsdom
 */
import updateStatus from "../src/js/updateStatus.mjs";

import { jest } from "@jest/globals";

describe("updateStatus helper", () => {
  beforeEach(() => {
    global.chrome = { runtime: { sendMessage: jest.fn() } };
  });

  it("sends correct message payload with all parameters", () => {
    const details = { currentRecord: "1", currentField: "A", error: "err" };
    updateStatus("msg", 50, "in_progress", details);
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "auditStatus",
      message: "msg",
      progress: 50,
      status: "in_progress",
      currentRecord: "1",
      currentField: "A",
      error: "err",
    });
  });

  it("defaults progress, status, and details when omitted", () => {
    updateStatus("hello");
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "auditStatus",
      message: "hello",
      progress: null,
      status: "in_progress",
      currentRecord: null,
      currentField: null,
      error: null,
    });
  });
});
