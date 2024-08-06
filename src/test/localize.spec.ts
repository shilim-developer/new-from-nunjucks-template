import {
  afterEach,
  describe,
  expect,
  test,
  vi,
  type MockInstance,
} from "vitest";
import { Localize } from "../localize";
vi.mock("vscode");

const mockList: MockInstance[] = [];

function clearMockList() {
  while (mockList.length > 0) {
    mockList.pop()!.mockClear();
  }
}

describe("localize.test", () => {
  afterEach(() => {
    clearMockList();
    vi.unstubAllEnvs();
  });

  test("init Error", async () => {
    vi.stubEnv("VSCODE_NLS_CONFIG", "{errorJson}");
    expect(() => new Localize()).toThrowError();
  });

  test("localize args", async () => {
    const localize = new Localize();
    expect(localize.localize("ext.{0}.{1}" as any, "config", "input")).equals(
      "ext.config.input"
    );
  });
});
