import { scrollToPdfText } from "../src/js/content-helpers";

describe("scrollToPdfText", () => {
  beforeAll(() => {
    // Mock window.find and requestAnimationFrame for JSDOM
    global.window.find = jest.fn();
    global.requestAnimationFrame = (cb) => cb();
  });

  beforeEach(() => {
    document.body.innerHTML = "";
    window.find.mockClear();
  });

  it("returns false when no matching text and no elements", async () => {
    const result = await scrollToPdfText("Foo");
    expect(result).toBe(false);
  });

  it("catches window.find errors and still returns false", async () => {
    window.find.mockImplementation(() => {
      throw new Error("fail");
    });
    const result = await scrollToPdfText("Bar");
    expect(result).toBe(false);
  });

  it("finds element by manual scan and returns true", async () => {
    document.body.innerHTML = "<p>Some text</p><div>target</div>";
    const result = await scrollToPdfText("target");
    expect(result).toBe(true);
  });
});
