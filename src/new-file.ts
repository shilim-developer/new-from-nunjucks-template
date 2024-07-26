import path from "path";
import fs from "fs";
import * as vscode from "vscode";
import nunjucks from "nunjucks";
import localize from "./localize";

let workSpaceFolder = "";
let templateRootFolder = "";
let productFolder = "";

function getWorkSpaceFolder(currentUri: vscode.Uri) {
  const selectedWorkspaceFolder =
    vscode.workspace.getWorkspaceFolder(currentUri);
  return selectedWorkspaceFolder ? selectedWorkspaceFolder.uri.fsPath : "";
}

function getSchemeUrl(url: string) {
  const currentUri = vscode.Uri.file(url);
  return currentUri.scheme + "://" + currentUri.authority + currentUri.path;
}

async function selectTemplate() {
  const templateFiles = fs.readdirSync(templateRootFolder);
  const templateList = templateFiles
    .filter((file) => {
      return !path.extname(`file${file}`);
    })
    .map((file) => ({
      title: file,
      value: file,
    }));
  let templateData;
  try {
    templateData = await vscode.window.showQuickPick(
      templateList.map((template) => ({
        label: template.title,
        description: template.value,
      }))
    );
  } catch (error) {}
  return templateData;
}

// 参数列表
let paramsObject: any = {};
let globalParams = {};

let folderParamsList: any[] = [];

// 回调
let callback = {};

/**
 * 参数列表格式化成对象
 */
function initParamsObj(params: any) {
  return params.reduce((pre: any, cur: any) => ((pre[cur] = ""), pre), {});
}

/**
 * 根据参数替换文件夹/文件名称
 * @param {String} pathName 文件夹/文件名称
 * @returns 新的名称
 */
function getReplaceValue(pathName: string) {
  let newPathName = pathName;
  for (const key of folderParamsList) {
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
function render(filePath: string, context: any) {
  const file = fs.readFileSync(filePath, { encoding: "utf-8" });
  return nunjucks.renderString(file, context);
}

/**
 * 根据模板生成文件
 * @param {String} templateDir 模板文件夹路径
 * @param {String} outDir 输出路径
 */
function productCode(templateDir: string, outDir: string) {
  console.log("outDir:", outDir);
  // 遍历模板目录下的文件
  let files = fs.readdirSync(templateDir);
  files.map(function (file) {
    // 模板文件路径
    const templatePath = path.join(templateDir, file);
    // 拿到文件信息对象
    const stats = fs.statSync(templatePath);
    // 输出文件路径
    const newFilePath = path.join(outDir, getReplaceValue(path.basename(file)));
    // 判断是否为文件夹类型
    if (stats.isDirectory()) {
      // 创建文件夹
      fs.mkdirSync(newFilePath);
      try {
        // callback.newFolder && callback.newFolder(newFilePath, paramsObject);
      } catch (error) {
        console.log(error);
      }
      return productCode(templatePath, newFilePath); // 递归读取文件夹
    } else if (!["@@config.js", "@@params.js"].includes(path.basename(file))) {
      // 过滤配置文件
      // 创建文件
      const content = render(templatePath, paramsObject);
      fs.writeFileSync(newFilePath, content);
      try {
        // callback.newFile && callback.newFile(newFilePath, paramsObject);
      } catch (error) {
        console.log(error);
      }
    }
  });
}

async function createFile(templateName: string, paramsPath?: string) {
  // 读取公共参数配置
  try {
    globalParams = require(path.join(templateRootFolder, "/params.js"))();
  } catch (error) {}
  try {
    callback = require(path.join(templateRootFolder, "/callback.js"));
  } catch (error) {}
  const { fileParams, templateParams } = await import(
    getSchemeUrl(path.join(templateRootFolder, `${templateName}/@@config.js`))
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
      console.log(`✖ please check the correctness of the path!`);
      return;
    }
  } else {
    paramsObject = Object.assign({}, initParamsObj(paramsList), globalParams);
    console.log("paramsObject:", paramsObject);
    const keyAnswerObject: { [key: string]: string } = {};
    for (const key of paramsList) {
      const answer = await vscode.window.showInputBox({
        prompt: `${localize("ext.config.input")} ${key}`,
        value: "",
        placeHolder: `${localize("ext.config.input")} ${key}`,
        ignoreFocusOut: true,
      });
      if (!answer) {
        return;
      }
      keyAnswerObject[key] = answer;
    }
    paramsObject = { ...paramsObject, ...keyAnswerObject };
  }
  productCode(path.join(templateRootFolder, `${templateName}`), productFolder);
}

export async function newFile(args: vscode.Uri) {
  console.log("args:", args);
  // 初始化变量
  workSpaceFolder = getWorkSpaceFolder(args);
  console.log("workSpaceFolder:", args.toString());
  templateRootFolder = path.join(workSpaceFolder, ".templates");
  const stats = fs.statSync(args.fsPath);
  productFolder = stats.isDirectory() ? args.fsPath : path.dirname(args.fsPath);
  console.log("productFolder:", productFolder);
  // 选择模板
  const templateData = await selectTemplate();
  if (templateData) {
    createFile(templateData.label);
  }
}
