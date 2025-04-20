import { jest } from "@jest/globals";

global.fetch = jest.fn((url) => {
  // For debug visibility

  console.log("MOCK FETCH URL:", url);
  if (typeof url === "string" && url.includes("!8:8")) {
    // Header fetch
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ values: [["A", "B"]] }),
    });
  }
  if (typeof url === "string" && url.includes("!9:1000")) {
    // Data fetch
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          headers: ["A", "B"],
          records: [{ _row: 1, A: "1", B: "2" }],
        }),
    });
  }
  // fallback for any other fetch
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
});

global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
  },
  identity: {
    getAuthToken: jest.fn((opts, cb) => cb("fake-token")),
  },
  tabs: {
    create: jest.fn().mockResolvedValue({
      id: 1,
      url: "https://preiss.entrata.com/?module=customers_systemxxx",
      status: "complete",
    }),
    get: jest.fn().mockImplementation((tabId, cb) =>
      cb({
        id: tabId,
        url: "https://preiss.entrata.com/?module=customers_systemxxx",
        status: "complete",
      }),
    ),
    sendMessage: jest.fn().mockImplementation((tabId, msg, cb) => {
      cb && cb({ success: true });
    }),
  },
};
global.alert = jest.fn();

// Stub LeaseAudit and RenewalAudit to skip real browser interactions
class MockAudit {
  constructor() {
    this.sheetName = "Lease Audit";
  }
  async setUp() {
    return { success: true, tabId: 1 };
  }
  nextFields() {
    return ["A", "B"];
  }
  async runField() {
    return { match: true };
  }
}
await jest.unstable_mockModule("../src/js/audit-types/lease-audit", () => ({
  __esModule: true,
  default: MockAudit,
}));
await jest.unstable_mockModule("../src/js/audit-types/renewal-audit", () => ({
  __esModule: true,
  default: MockAudit,
}));

await jest.unstable_mockModule("../src/js/sheets", () => ({
  __esModule: true,
  fetchSheetData: jest.fn().mockResolvedValue({ headers: ["A", "B"], records: [{ _row: 1, A: "1", B: "2" }] }),
  updateSheetCell: jest.fn().mockResolvedValue({}),
  addSheetComment: jest.fn().mockResolvedValue({}),
  default: {
    fetchSheetData: jest.fn().mockResolvedValue({ headers: ["A", "B"], records: [{ _row: 1, A: "1", B: "2" }] }),
    updateSheetCell: jest.fn().mockResolvedValue({}),
    addSheetComment: jest.fn().mockResolvedValue({}),
  },
}));

let AuditController;
beforeAll(async () => {
  ({ default: AuditController } = await import("../src/js/AuditController"));
});

describe("AuditController", () => {
  it("starts and completes without errors", async () => {
    await AuditController.start({ spreadsheetId: "sheet123", auditType: "lease" });
    const state = AuditController.getState();
    if (state.status === "error") {
      console.error("AuditController error:", state.error);
    }
    expect(state.status).toBe("complete");
  }, 20000);

  it("handles stop request", async () => {
    AuditController.stop();
    expect(AuditController.getState().status).toBe("stopped");
  });
});
