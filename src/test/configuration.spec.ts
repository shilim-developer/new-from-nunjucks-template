import { Configuration } from "./../configuration";
import {
  afterEach,
  describe,
  expect,
  test,
  vi,
  type MockInstance,
} from "vitest";
import { workspace } from "vscode";
import path from "path";

vi.mock("vscode");

const mockList: MockInstance[] = [];

function clearMockList() {
  while (mockList.length > 0) {
    mockList.pop()!.mockClear();
  }
}

describe("configuration.test", () => {
  afterEach(() => {
    clearMockList();
  });

  test("getTemplateUrl", async () => {
    const templateUrl = path.resolve(".vscode/.templates");
    mockList.push(
      vi.spyOn(workspace, "getConfiguration").mockImplementation(
        () =>
          ({
            get: () => templateUrl,
          } as any)
      )
    );
    const configuration = new Configuration();
    expect(configuration.templateUrl).equal(templateUrl);
  });
  test("getTemplateUrl empty", async () => {
    const templateUrl = "";
    mockList.push(
      vi.spyOn(workspace, "getConfiguration").mockImplementation(
        () =>
          ({
            get: () => templateUrl,
          } as any)
      )
    );
    const configuration = new Configuration();
    expect(configuration.templateUrl).equal(".templates");
  });
});
