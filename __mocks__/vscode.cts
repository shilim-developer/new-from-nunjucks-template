import { vi } from "vitest";
import { createVSCodeMock } from "jest-mock-vscode";

const vscode = createVSCodeMock(vi);
const rootUri = vscode.Uri.file(process.cwd());
vscode.workspace.getWorkspaceFolder = vi.fn().mockImplementation((uri) => uri);
// @ts-ignore
vscode.extensions = {
  getExtension: vi.fn().mockReturnValue({
    extensionPath: rootUri.fsPath,
  }),
};
module.exports = vscode;
