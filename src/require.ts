import path from "path";
import fs from "fs";
import vm from "vm";

const wrapper = [
  "(function (exports, require, module, __dirname, __filename) {\r\n",
  "\r\n})",
];

class CustomModule {
  id: string;
  exports: any = {};
  extensions: { [key: string]: (module: CustomModule) => void } = {
    ".js": (module) => {
      const script = fs.readFileSync(module.id, "utf8");
      const content = wrapper[0] + script + wrapper[1];
      const fn = vm.runInThisContext(content); // 这里就会返回一个js函数
      const __dirname = path.dirname(module.id);
      // 保持commonjs require的相对路径
      const customRequire = (pStr: string) => {
        try {
          return require(path.join(__dirname, pStr));
        } catch (error) {
          return require(pStr);
        }
      };
      // 让函数执行
      fn.call(
        module.exports,
        module.exports,
        customRequire,
        module,
        __dirname,
        module.id
      );
    },
    ".json": (module) => {
      const script = fs.readFileSync(module.id, "utf8");
      module.exports = JSON.parse(script);
    },
  };

  constructor(id: string, root?: string) {
    this.id = this._resolveFilename(id);
    this.exports = {};
    // 自动加载模块
    const ext = path.extname(this.id);
    this.extensions[ext](this);
  }

  _resolveFilename(id: string) {
    // 将相对路径转化成绝对路径
    const absPath = path.resolve(id);
    //  先判断文件是否存在如果存在
    if (fs.existsSync(absPath)) {
      return absPath;
    }
    // 去尝试添加文件后缀 .js .json
    const extensions = Object.keys(this.extensions);
    for (let i = 0; i < extensions.length; i++) {
      const ext = extensions[i];
      // 判断路径是否存在
      const currentPath = absPath + ext;
      const exits = fs.existsSync(currentPath);
      if (exits) {
        return currentPath;
      }
    }
    throw new Error("文件不存在");
  }
}

export function jsRequire(id: string) {
  // 加载module
  const module = new CustomModule(id);
  return module.exports;
}
