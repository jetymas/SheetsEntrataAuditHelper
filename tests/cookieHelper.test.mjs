import { jest } from "@jest/globals";
import { getCookie, setCookie } from "../src/js/cookieHelper";

describe("cookieHelper", () => {
  beforeEach(() => {
    global.chrome = {
      cookies: { get: jest.fn(), set: jest.fn() },
      runtime: { lastError: null },
    };
  });

  test("getCookie resolves cookie value", async () => {
    const fakeCookie = { value: "abc" };
    chrome.cookies.get.mockImplementation(({ _url, _name }, cb) =>
      cb(fakeCookie),
    );
    const val = await getCookie("http://example.com", "session");
    expect(val).toBe("abc");
  });

  test("getCookie resolves null if cookie not found", async () => {
    chrome.cookies.get.mockImplementation(({ _url, _name }, cb) => cb(null));
    const val = await getCookie("http://example.com", "nope");
    expect(val).toBeNull();
  });

  test("getCookie rejects when chrome.runtime.lastError", async () => {
    const err = new Error("fail");
    chrome.runtime.lastError = err;
    chrome.cookies.get.mockImplementation(({ _url, _name }, cb) => cb(null));
    await expect(getCookie("u", "n")).rejects.toBe(err);
  });

  test("setCookie sets cookie and resolves", async () => {
    const cookieRes = { name: "n", value: "v" };
    chrome.cookies.set.mockImplementation((details, cb) => cb(cookieRes));
    const result = await setCookie({
      url: "http://example.com",
      name: "n",
      value: "v",
    });
    expect(result).toBe(cookieRes);
    expect(chrome.cookies.set).toHaveBeenCalledWith(
      expect.objectContaining({ sameSite: "no_restriction", secure: true }),
      expect.any(Function),
    );
  });

  test("setCookie rejects when chrome.runtime.lastError", async () => {
    const err = new Error("set fail");
    chrome.runtime.lastError = err;
    chrome.cookies.set.mockImplementation((details, cb) => cb(null));
    await expect(setCookie({ url: "u", name: "n", value: "v" })).rejects.toBe(
      err,
    );
  });

  test("setCookie includes expirationDate when provided", async () => {
    chrome.cookies.set.mockImplementation((details, cb) => cb(details));
    const result = await setCookie({
      url: "http://example.com",
      name: "n",
      value: "v",
      expirationDate: 999,
    });
    expect(result.expirationDate).toBe(999);
  });
});
