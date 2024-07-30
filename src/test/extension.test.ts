import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { newFile } from "../new-file";
// import * as myExtension from '../../extension';

suite("Extension Test Suite", async () => {
  vscode.window.showInformationMessage("Start all tests.");
  await newFile(vscode.Uri.file("/"));
  test("Sample test", () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });
});
