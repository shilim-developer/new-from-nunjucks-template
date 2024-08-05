exports.newFolder = (path, params) => {
  console.log("创建文件夹成功回调");
};

exports.newFile = (path) => {
  console.log(path);
  console.log("创建文件成功回调");
};

exports.finish = () => {
  console.log("finish");
};
