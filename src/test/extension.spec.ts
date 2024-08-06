import {
  beforeEach,
  afterEach,
  describe,
  expect,
  test,
  vi,
  type MockInstance,
} from "vitest";
import { Uri, window } from "vscode";
import { newFile } from "../new-file";
import path from "path";
import { existsSync, mkdirSync, removeSync } from "fs-extra";
import { readFileSync } from "fs";
import localize from "../localize";
import { jsRequire } from "../require";

vi.mock("vscode");

const templateUri = Uri.file(path.join(process.cwd(), ".templates"));
const testUri = Uri.file(path.join(process.cwd(), "test-workspace"));
const templateGlobalUri = Uri.file(
  path.join(process.cwd(), ".templates/global.js")
);
const globalData = jsRequire(templateGlobalUri.fsPath)();
const mockList: MockInstance[] = [];

function clearMockList() {
  while (mockList.length > 0) {
    mockList.pop()!.mockClear();
  }
}

describe("extension.test", () => {
  beforeEach(() => {
    mockList.push(vi.spyOn(console, "log"));
    removeSync(testUri.fsPath);
    mkdirSync(testUri.fsPath);
  });

  afterEach(() => {
    clearMockList();
    removeSync(testUri.fsPath);
  });

  test("create file", async () => {
    const templateName = "template_file";
    const fileName = "shilim";
    const fileContent = "content";
    mockList.push(
      vi
        .spyOn(window, "showQuickPick")
        .mockResolvedValueOnce({
          label: templateName,
          description: "",
        })
        .mockResolvedValueOnce({
          label: localize("ext.config.notUseParams"),
        }),
      vi
        .spyOn(window, "showInputBox")
        .mockResolvedValueOnce(fileName)
        .mockResolvedValueOnce(fileContent)
    );
    await newFile(testUri);
    expect(existsSync(path.join(testUri.fsPath, `${fileName}.js`))).toEqual(
      true
    );
    expect(
      existsSync(
        path.join(testUri.fsPath, `${globalData.prefix}-${fileName}.js`)
      )
    ).toEqual(true);
    expect(
      readFileSync(path.join(testUri.fsPath, `${fileName}.js`)).toString()
    ).toEqual(fileContent);
    expect(mockList[0]).toHaveBeenCalledWith(
      path.join(testUri.fsPath, `${globalData.prefix}-${fileName}.js`)
    );
    expect(mockList[0]).toHaveBeenCalledWith("创建文件成功回调");
    expect(mockList[0]).toHaveBeenCalledWith("finish");
  });

  test("create file use local params", async () => {
    const templateName = "template_file";
    const localParams = jsRequire(
      path.join(templateUri.fsPath, `${templateName}/@@params.js`)
    )();
    const fileName = localParams.fileParams.file_name;
    const fileContent = localParams.templateParams.content;
    mockList.push(
      vi
        .spyOn(window, "showQuickPick")
        .mockResolvedValueOnce({
          label: templateName,
          description: "",
        })
        .mockResolvedValueOnce({
          label: localize("ext.config.useParams"),
        })
    );
    await newFile(testUri);
    expect(existsSync(path.join(testUri.fsPath, `${fileName}.js`))).toEqual(
      true
    );
    expect(
      existsSync(
        path.join(testUri.fsPath, `${globalData.prefix}-${fileName}.js`)
      )
    ).toEqual(true);
    expect(
      readFileSync(path.join(testUri.fsPath, `${fileName}.js`)).toString()
    ).toEqual(fileContent);
    expect(mockList[0]).toHaveBeenCalledWith(
      path.join(testUri.fsPath, `${globalData.prefix}-${fileName}.js`)
    );
  });

  test("exits file accept", async () => {
    const templateName = "template_file";
    const fileName = "shilim";
    const fileContent = "content";
    const fileContent2 = "content2";
    mockList.push(
      vi.spyOn(window, "showQuickPick").mockResolvedValue({
        label: templateName,
        description: "",
      }),
      vi
        .spyOn(window, "showWarningMessage")
        .mockResolvedValue(localize("ext.config.confirm") as any),
      vi
        .spyOn(window, "showInputBox")
        .mockResolvedValueOnce(fileName)
        .mockResolvedValueOnce(fileContent)
        .mockResolvedValueOnce(fileName)
        .mockResolvedValueOnce(fileContent2)
    );
    await newFile(testUri);
    expect(existsSync(path.join(testUri.fsPath, `${fileName}.js`))).toEqual(
      true
    );
    expect(
      readFileSync(path.join(testUri.fsPath, `${fileName}.js`)).toString()
    ).toEqual(fileContent);
    await newFile(testUri);
    expect(existsSync(path.join(testUri.fsPath, `${fileName}.js`))).toEqual(
      true
    );
    expect(
      readFileSync(path.join(testUri.fsPath, `${fileName}.js`)).toString()
    ).toEqual(fileContent2);
  });

  test("exits file cancel", async () => {
    const templateName = "template_file";
    const fileName = "shilim";
    const fileContent = "content";
    const fileContent2 = "content2";
    mockList.push(
      vi.spyOn(window, "showQuickPick").mockResolvedValue({
        label: templateName,
        description: "",
      }),
      vi
        .spyOn(window, "showWarningMessage")
        .mockResolvedValue(localize("ext.config.cancel") as any),
      vi
        .spyOn(window, "showInputBox")
        .mockResolvedValueOnce(fileName)
        .mockResolvedValueOnce(fileContent)
        .mockResolvedValueOnce(fileName)
        .mockResolvedValueOnce(fileContent2)
    );
    await newFile(testUri);
    expect(existsSync(path.join(testUri.fsPath, `${fileName}.js`))).toEqual(
      true
    );
    expect(
      readFileSync(path.join(testUri.fsPath, `${fileName}.js`)).toString()
    ).toEqual(fileContent);
    await newFile(testUri);
    expect(existsSync(path.join(testUri.fsPath, `${fileName}.js`))).toEqual(
      true
    );
    expect(
      readFileSync(path.join(testUri.fsPath, `${fileName}.js`)).toString()
    ).toEqual(fileContent);
  });

  test("create folder", async () => {
    const templateName = "template_folder";
    const folderName = "shilim";
    const fileName = "button";
    mockList.push(
      vi.spyOn(window, "showQuickPick").mockResolvedValue({
        label: templateName,
        description: "",
      }),
      vi
        .spyOn(window, "showInputBox")
        .mockResolvedValueOnce(folderName)
        .mockResolvedValueOnce(fileName)
    );
    await newFile(testUri);
    expect(existsSync(path.join(testUri.fsPath, `${folderName}`))).toEqual(
      true
    );
    expect(
      existsSync(path.join(testUri.fsPath, `${folderName}/${fileName}.js`))
    ).toEqual(true);
    expect(
      existsSync(path.join(testUri.fsPath, `${folderName}/${fileName}.css`))
    ).toEqual(true);
    expect(
      existsSync(path.join(testUri.fsPath, `${folderName}/${fileName}.html`))
    ).toEqual(true);
    expect(mockList[0]).toHaveBeenCalledWith(
      path.join(testUri.fsPath, `${folderName}`)
    );
    expect(mockList[0]).toHaveBeenCalledWith("创建文件夹成功回调");
    expect(mockList[0]).toHaveBeenCalledWith("finish");
  });

  test("exits folder accept", async () => {
    const templateName = "template_folder";
    const folderName = "shilim";
    const fileName = "button";
    const fileName2 = "button2";
    mockList.push(
      vi.spyOn(window, "showQuickPick").mockResolvedValue({
        label: templateName,
        description: "",
      }),
      vi
        .spyOn(window, "showWarningMessage")
        .mockResolvedValue(localize("ext.config.confirm") as any),
      vi
        .spyOn(window, "showInputBox")
        .mockResolvedValueOnce(folderName)
        .mockResolvedValueOnce(fileName)
        .mockResolvedValueOnce(folderName)
        .mockResolvedValueOnce(fileName2)
    );
    await newFile(testUri);
    expect(existsSync(path.join(testUri.fsPath, `${folderName}`))).toEqual(
      true
    );
    expect(
      existsSync(path.join(testUri.fsPath, `${folderName}/${fileName}.js`))
    ).toEqual(true);
    expect(
      existsSync(path.join(testUri.fsPath, `${folderName}/${fileName}.css`))
    ).toEqual(true);
    expect(
      existsSync(path.join(testUri.fsPath, `${folderName}/${fileName}.html`))
    ).toEqual(true);
    await newFile(testUri);
    expect(existsSync(path.join(testUri.fsPath, `${folderName}`))).toEqual(
      true
    );
    expect(
      existsSync(path.join(testUri.fsPath, `${folderName}/${fileName2}.js`))
    ).toEqual(true);
    expect(
      existsSync(path.join(testUri.fsPath, `${folderName}/${fileName2}.css`))
    ).toEqual(true);
    expect(
      existsSync(path.join(testUri.fsPath, `${folderName}/${fileName2}.html`))
    ).toEqual(true);
  });

  test("exits folder cancel", async () => {
    const templateName = "template_folder";
    const folderName = "shilim";
    const fileName = "button";
    const fileName2 = "button2";
    mockList.push(
      vi.spyOn(window, "showQuickPick").mockResolvedValue({
        label: templateName,
        description: "",
      }),
      vi
        .spyOn(window, "showWarningMessage")
        .mockResolvedValue(localize("ext.config.cancel") as any),
      vi
        .spyOn(window, "showInputBox")
        .mockResolvedValueOnce(folderName)
        .mockResolvedValueOnce(fileName)
        .mockResolvedValueOnce(folderName)
        .mockResolvedValueOnce(fileName2)
    );
    await newFile(testUri);
    expect(existsSync(path.join(testUri.fsPath, `${folderName}`))).toEqual(
      true
    );
    expect(
      existsSync(path.join(testUri.fsPath, `${folderName}/${fileName}.js`))
    ).toEqual(true);
    expect(
      existsSync(path.join(testUri.fsPath, `${folderName}/${fileName}.css`))
    ).toEqual(true);
    expect(
      existsSync(path.join(testUri.fsPath, `${folderName}/${fileName}.html`))
    ).toEqual(true);
    await newFile(testUri);
    expect(existsSync(path.join(testUri.fsPath, `${folderName}`))).toEqual(
      true
    );
    expect(
      existsSync(path.join(testUri.fsPath, `${folderName}/${fileName}.js`))
    ).toEqual(true);
    expect(
      existsSync(path.join(testUri.fsPath, `${folderName}/${fileName}.css`))
    ).toEqual(true);
    expect(
      existsSync(path.join(testUri.fsPath, `${folderName}/${fileName}.html`))
    ).toEqual(true);
  });
});
