import path from "path";
import fs from "fs-extra";
import * as vscode from "vscode";
import nunjucks from "nunjucks";
import localize from "./localize";
import { jsRequire } from "./require";
import { Configuration } from "./configuration";

interface CallBack {
  newFolder?: (path: string, params: any) => void;
  newFile?: (path: string, params: any) => void;
}

let configuration: Configuration;
// 目录
// 工作空间目录
let workSpaceFolder = "";
// 模板目录
let templateRootFolder = "";
// 输出目录
let productFolder = "";

// 参数列表
// 全部参数
let paramsObject: any = {};
// 全局参数
let globalParams = {};
// 文件夹参数列表
let folderParamsList: any[] = [];

// 回调
let callback: CallBack = {};
let globalCallback: CallBack = {};

/**
 * 获取当前工作空间目录
 */
function getWorkSpaceFolder(currentUri: vscode.Uri) {
  const selectedWorkspaceFolder =
    vscode.workspace.getWorkspaceFolder(currentUri);
  return selectedWorkspaceFolder ? selectedWorkspaceFolder.uri.fsPath : "";
}

/**
 * 获取要替换的参数字符串
 */
function getReplaceParamStr(params: string | { value: string }) {
  return typeof params === "string" ? params : params.value;
}

/**
 * 选择模板
 */
async function selectTemplate() {
  const templateFiles = fs.readdirSync(templateRootFolder);
  const templateList = templateFiles
    .filter((file) => {
      return !path.extname(`file${file}`);
    })
    .map((file) => {
      return {
        label: file,
      };
    });
  let templateData;
  try {
    templateData = await vscode.window.showQuickPick(templateList);
  } catch (error) {}
  return templateData;
}

/**
 * 参数列表格式化成对象
 */
function initParamsObj(params: any) {
  return params.reduce(
    (pre: any, cur: any) => ((pre[getReplaceParamStr(cur)] = ""), pre),
    {}
  );
}

/**
 * 根据参数替换文件夹/文件名称
 * @param {String} pathName 文件夹/文件名称
 * @returns 新的名称
 */
function getReplaceValue(pathName: string) {
  let newPathName = pathName;
  for (const folderParams of folderParamsList) {
    const key = getReplaceParamStr(folderParams);
    if (pathName.indexOf(key) >= 0) {
      newPathName = newPathName.replace(
        new RegExp(`${key}`, "g"),
        paramsObject[key]
      );
    }
  }
  return newPathName;
}

/**
 * 模板渲染
 * @param {String} filePath 模板路径
 * @param {Object} context 模板参数
 * @returns {String} 渲染内容
 */
function render(filePath: string, context: any): string {
  const file = fs.readFileSync(filePath, { encoding: "utf-8" });
  return nunjucks.renderString(file, context);
}

/**
 * 根据模板生成文件
 * @param {String} templateDir 模板文件夹路径
 * @param {String} outDir 输出路径
 */
async function productCode(templateDir: string, outDir: string) {
  console.log("outDir:", outDir);
  // 遍历模板目录下的文件
  let files = fs.readdirSync(templateDir);
  for (const file of files) {
    // 模板文件路径
    const templatePath = path.join(templateDir, file);
    // 拿到文件信息对象
    const stats = fs.statSync(templatePath);
    // 新文件名
    const newFileName = getReplaceValue(path.basename(file));
    // 输出文件路径
    const newFilePath = path.join(outDir, newFileName);
    console.log("newFilePath:", newFilePath);
    // 判断是否为文件夹类型
    if (stats.isDirectory()) {
      // 判断文件夹是否已存在
      if (fs.pathExistsSync(newFilePath)) {
        const answer = await vscode.window.showWarningMessage(
          localize("ext.config.folderExists").replace(
            "${folderName}",
            newFileName
          ),
          localize("ext.config.confirm"),
          localize("ext.config.cancel")
        );
        if (answer === localize("ext.config.cancel")) {
          return;
        }
      }
      // 创建文件夹
      fs.emptyDirSync(newFilePath);
      try {
        callback.newFolder && callback.newFolder(newFilePath, paramsObject);
        globalCallback.newFolder &&
          globalCallback.newFolder(newFilePath, paramsObject);
      } catch (error) {
        console.log(error);
      }
      return productCode(templatePath, newFilePath); // 递归读取文件夹
    } else if (!["@@config.js", "@@params.js"].includes(path.basename(file))) {
      // 判断文件是否已存在
      if (fs.pathExistsSync(newFilePath)) {
        const answer = await vscode.window.showWarningMessage(
          localize("ext.config.fileExists").replace("${fileName}", newFileName),
          localize("ext.config.confirm"),
          localize("ext.config.cancel")
        );
        if (answer === localize("ext.config.cancel")) {
          return;
        }
      }
      // 过滤配置文件
      // 创建文件
      const content = render(templatePath, paramsObject);
      fs.writeFileSync(newFilePath, content);
      try {
        callback.newFile && callback.newFile(newFilePath, paramsObject);
        globalCallback.newFile &&
          globalCallback.newFile(newFilePath, paramsObject);
      } catch (error) {
        console.log(error);
      }
    }
  }
}

async function createFile(templateName: string, paramsPath?: string) {
  // 读取公共参数配置
  try {
    globalParams = jsRequire(path.join(templateRootFolder, "/global.js"))();
  } catch (error) {}
  try {
    globalCallback = jsRequire(path.join(templateRootFolder, "/callback.js"));
  } catch (error) {}
  try {
    callback = jsRequire(
      path.join(templateRootFolder, `${templateName}/@@callback.js`)
    );
  } catch (error) {}
  const { fileParams, templateParams } = jsRequire(
    path.join(templateRootFolder, `${templateName}/@@config.js`)
  );

  // 是否已经给出参数路径
  const paramsList = fileParams.concat(templateParams);
  const globalParamsList = Object.keys(globalParams);
  folderParamsList = fileParams.concat(globalParamsList);
  if (paramsPath) {
    paramsPath = path.isAbsolute(paramsPath)
      ? path.resolve(paramsPath)
      : path.join(process.cwd(), paramsPath);
    try {
      const outParamsObject = require(paramsPath)();
      folderParamsList = folderParamsList.concat(
        Object.keys(outParamsObject.fileParams)
      );
      paramsObject = Object.assign(
        {},
        outParamsObject.fileParams,
        outParamsObject.templateParams,
        globalParams
      );
    } catch (error) {
      vscode.window.showErrorMessage(localize("ext.config.pathError"));
      return;
    }
  } else {
    paramsObject = Object.assign({}, initParamsObj(paramsList), globalParams);
    const keyAnswerObject: { [key: string]: string } = {};
    for (const key of paramsList) {
      let prompt = "";
      let placeHolder = "";
      if (typeof key === "string") {
        placeHolder = key;
        prompt = key;
      } else {
        placeHolder = key.value;
        prompt = key.description;
      }
      const answer = await vscode.window.showInputBox({
        prompt: `${localize("ext.config.input")}${prompt}`,
        value: "",
        placeHolder: `${localize("ext.config.input")}${placeHolder}`,
        ignoreFocusOut: true,
      });
      if (!answer) {
        return;
      }
      keyAnswerObject[placeHolder] = answer;
    }
    paramsObject = { ...paramsObject, ...keyAnswerObject };
    console.log("paramsObject:", paramsObject);
  }
  await productCode(
    path.join(templateRootFolder, `${templateName}`),
    productFolder
  );
}

/**
 * 创建文件
 */
export async function newFile(args: vscode.Uri) {
  // console.log("args:", args);
  configuration = new Configuration();
  // 初始化变量
  workSpaceFolder = getWorkSpaceFolder(args);
  console.log("workSpaceFolder:", args.toString());
  templateRootFolder = path.join(workSpaceFolder, configuration.templateUrl);
  const stats = fs.statSync(args.fsPath);
  productFolder = stats.isDirectory() ? args.fsPath : path.dirname(args.fsPath);
  console.log("productFolder:", productFolder);
  // 选择模板
  const templateData = await selectTemplate();
  if (templateData) {
    await createFile(templateData.label);
  }
}
