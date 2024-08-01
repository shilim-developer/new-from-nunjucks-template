import { vi } from "vitest";
import { createVSCodeMock } from "jest-mock-vscode";

const vscode = createVSCodeMock(vi);
const rootUri = vscode.Uri.file(process.cwd());
console.log("rootUri:", rootUri.fsPath);
vscode.workspace.getWorkspaceFolder = vi
  .fn()
  .mockImplementation(() => ({ uri: rootUri }));
// @ts-ignore
vscode.extensions = {
  getExtension: vi.fn().mockReturnValue({
    extensionPath: rootUri.fsPath,
  }),
};
vscode.workspace.getConfiguration = vi.fn().mockImplementation(() => ({
  get: () => ".templates",
}));
module.exports = vscode;
