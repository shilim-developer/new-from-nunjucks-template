import * as vscode from "vscode";

export class Configuration {
  public get customConfig(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration("NewFromNunjucksTemplate");
  }

  public get templateUrl(): string {
    return this.customConfig.get<string>("templateUrl") || ".templates";
  }
}
