import fs from "fs";
import nodePath from "path";
import { GEN_API_DIR, GEN_TYPE_DIR } from ".";
import { ITag, ITagFileMap, IPath, IApiJSON, IPathDetail } from "./type";

const fileDependence: Map<string, Set<string>> = new Map();

const typeMap: Record<string, string> = {
  integer: "number",
  string: "string",
  boolean: "boolean",
};

function addToFileDependence(fileName: string, dependence: string) {
  let set: Set<string>;
  if (fileDependence.has(fileName)) {
    set = fileDependence.get(fileName)!;
  } else {
    set = new Set();
  }
  set.add(dependence);
  fileDependence.set(fileName, set);
}

/**
 *  生成文件并且返回tag和file对应map的数组
 */
function genFile(tags: ITag[]) {
  if (!fs.existsSync(GEN_API_DIR)) {
    fs.mkdirSync(GEN_API_DIR);
  }
  const tagFileMapList: ITagFileMap[] = tags.map((item) => {
    const fileNameList = item.description.split(" ");
    const fileName =
      fileNameList
        .slice(0, fileNameList.length - 1)
        .map((item) => item.toLocaleLowerCase())
        .join("_") + ".ts";

    fs.writeFileSync(nodePath.resolve(GEN_API_DIR, fileName), "");
    return {
      fileName,
      tagName: item.name,
    };
  });
  return tagFileMapList;
}

function getParamsType(pathDetail: IPathDetail) {
  const params = pathDetail.parameters.filter((item) => item.name !== "token");
  const param = params.find((item) => item.in === "query");
  if (param) {
    return "url";
  }
  return "json";
}

/**
 * 生成内容并且返回需要导入的类型
 */
function genContent(
  fileName: string,
  url: string,
  pathDetail: IPathDetail,
  type: "get" | "post"
) {
  const paramType = getParamsType(pathDetail);
  // 需要导入的类型
  // 排除掉token、
  // TODO 读取配置文件根据配置文件来排除掉某一些属性
  // TODO item.in 为body的时候会有对于的实体类，找到实体类生成对应的字符串
  let paramsString: string = "";
  if (paramType === "url") {
    pathDetail.parameters
      .filter((item) => item.name !== "token")
      .forEach((item) => {
        if (paramsString !== "") paramsString += ",";
        paramsString =
          paramsString +
          `${item.name}${item.required ? "" : "?"}: ${typeMap[item.type]}`;
      });
    if (paramsString) {
      paramsString = `data: {${paramsString}}`;
    }
  } else {
    const params = pathDetail.parameters.filter(
      (item) => item.name !== "token"
    );
    if (params.length > 0) {
      const param = pathDetail.parameters[0];
      paramsString = `data: ${param.schema?.originalRef}`;
      // needInputList.push(param.schema!.originalRef);
      addToFileDependence(fileName, param.schema!.originalRef);
    }
  }

  let configString = "";
  if (paramsString) {
    configString = "data";
  }

  // console.log(
  //   "pathDetail.responses[200].schema",
  //   pathDetail,
  //   pathDetail.responses[200].schema
  // );

  let returnTypeString = "any"; // 默认为any 有些接口文档不标准没有返回值类型
  if (pathDetail.responses[200].schema) {
    const dependenceList = pathDetail.responses[200].schema.originalRef
      .split("«")
      .map((item) => item.replace(/»/g, "")); // replace只能替换一个，使用正则替换全部

    const dependence = dependenceList[dependenceList.length - 1];
    if (dependenceList.includes("Page")) {
      returnTypeString = `ResponsePage<${dependence}>`;
    } else if (dependenceList.includes("List")) {
      returnTypeString = `Response<${dependence}[]>`;
    } else if (dependence === "Result") {
      returnTypeString = `Response<any>`;
    } else {
      returnTypeString = `Response<${dependence}>`;
    }

    const noImportType = ["string", "integer", "boolean", "object"];
    if (dependence !== "Result" && !noImportType.includes(dependence))
      addToFileDependence(fileName, dependence);
  }

  // pathDetail.responses[200].schema;

  const content = `
// ${pathDetail.description ?? ""}
export function ${pathDetail.operationId}(${paramsString}) {
  return request.${type}<${returnTypeString}>("${url}",${configString})
}
`;
  return content;
}

/**
 * 引入每个文件拥有的依赖
 */
function addDependenceToFile() {
  for (let [fileName, dependenceSet] of fileDependence.entries()) {
    let dependenceString = "";
    if (dependenceSet.size > 0) {
      for (let dependence of dependenceSet.values()) {
        if (dependenceString !== "") dependenceString += ",";
        dependenceString += dependence;
      }
    }

    const computedFilePath = nodePath.resolve(GEN_API_DIR, fileName);
    const dependenceResultString = `import type { ${dependenceString} } from "../${GEN_TYPE_DIR}"`;
    const prevString = fs.readFileSync(computedFilePath);
    fs.writeFileSync(computedFilePath, dependenceResultString);
    fs.appendFileSync(computedFilePath, prevString);
  }
}

/**
 * 生成类型
 */
function genType(apiJSON: IApiJSON) {
  if (!fs.existsSync(GEN_TYPE_DIR)) {
    fs.mkdirSync(GEN_TYPE_DIR);
  }
  fs.writeFileSync(nodePath.resolve(GEN_TYPE_DIR, "index.ts"), "");

  let typeList: string[] = [];
  for (let dependenceSet of fileDependence.values()) {
    typeList = typeList.concat(...dependenceSet);
  }
  console.log("typeList", typeList);
  for (let key in apiJSON.definitions) {
    if (typeList.includes(key)) {
      const value = apiJSON.definitions[key];

      let propertyString = "";
      for (let propertyKey in value.properties) {
        const propertyValue = value.properties[propertyKey];
        propertyString += `  ${propertyKey}: ${typeMap[propertyValue.type]};\n`;
      }
      const content = `
export interface ${value.title} {
${propertyString}}
      `;
      fs.appendFileSync(nodePath.resolve(GEN_TYPE_DIR, "index.ts"), content);
    }
  }
}

/**
 * 生成api代码的入口
 */
export function gen(apiJSON: IApiJSON) {
  const tags = apiJSON.tags;
  /**
   * ITag
   * description: "Page Config Controller"
   * name: "前端首页模块"
   */
  const tagFileMapList = genFile(tags);

  /**
   * path.get | path.post tags只有一个 匹配上面的文件生成内容写入到文件内
   */

  const apiPaths = apiJSON.paths;
  for (let url in apiPaths) {
    const path = apiPaths[url];
    let pathTag: string;
    let requestType: "get" | "post";
    let pathDetail: IPathDetail;
    if ("get" in path) {
      pathTag = path.get.tags.join("");
      requestType = "get";
      pathDetail = path.get;
    } else {
      pathTag = path.post.tags.join("");
      requestType = "post";
      pathDetail = path.post;
    }
    const tagFileMap = tagFileMapList.find((item) => item.tagName === pathTag);
    if (tagFileMap) {
      const content = genContent(
        tagFileMap.fileName,
        url,
        pathDetail,
        requestType
      );
      fs.appendFileSync(
        nodePath.resolve(GEN_API_DIR, tagFileMap.fileName),
        content
      );
    } else {
      console.log("tagFile not found!!!");
    }
  }

  addDependenceToFile();
  genType(apiJSON);
}
