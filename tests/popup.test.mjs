import { jest } from "@jest/globals";
import { initPopup } from "../src/js/popup.mjs";

// Mock chrome.storage and chrome.runtime
global.chrome = {
  storage: { local: { get: jest.fn((keys, cb) => cb({})), set: jest.fn() } },
  runtime: {
    sendMessage: jest.fn((msg, cb) => cb && cb({})),
    onMessage: { addListener: jest.fn() },
  },
};

describe("popup initPopup", () => {
  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <input id="spreadsheetUrl" />
      <button id="startAudit"></button>
      <button id="stopAudit"></button>
      <button id="skipRecord" class="hidden"></button>
      <div id="status" class="hidden"></div>
      <div id="statusText"></div>
      <div id="progressBar" style="width:0%"></div>
      <div id="recordInfo"></div>
      <div id="fieldInfo"></div>
      <div id="errorInfo" class="hidden"></div>
    `;
  });

  test("shows error when URL is empty", () => {
    initPopup();
    const startBtn = document.getElementById("startAudit");
    startBtn.click();
    const errorDiv = document.getElementById("errorInfo");
    expect(errorDiv.textContent).toBe("Please enter a Google Sheet URL");
    expect(errorDiv.classList.contains("hidden")).toBe(false);
  });

  test("extracts ID and starts flow", async () => {
    // TODO: mock columnModules and showVerificationDialog if needed
    document.getElementById("spreadsheetUrl").value =
      "https://docs.google.com/spreadsheets/d/TEST_ID/edit";
    initPopup();
    const startBtn = document.getElementById("startAudit");
    await startBtn.click();
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith({
      spreadsheetUrl: expect.any(String),
    });
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "startAudit",
        spreadsheetId: "TEST_ID",
      }),
      expect.any(Function),
    );
  });
});
