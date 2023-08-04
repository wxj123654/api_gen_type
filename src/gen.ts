import fs from "fs";
import nodePath from "path";
import { GEN_API_DIR, GEN_TYPE_DIR } from ".";
import { ITag, ITagFileMap, IApiJSON, IPathDetail } from "./type";

const fileDependence: Map<string, Set<string>> = new Map();

const typeMap: Record<string, string> = {
  integer: "number",
  string: "string",
  boolean: "boolean",
  number: "number",
  object: "Record<string, any>",
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
  const params = pathDetail.parameters?.filter((item) => item.name !== "token");
  const param = params?.find((item) => item.in === "query");
  if (param) {
    return "url";
  }
  return "json";
}

function originalRefToType(fileName: string, ref: string) {
  let returnTypeString = "any";
  const dependenceList = ref.split("«").map((item) => item.replace(/»/g, "")); // replace只能替换一个，使用正则替换全部

  const dependence = dependenceList[dependenceList.length - 1];
  if (dependenceList.includes("Page")) {
    returnTypeString = `ResponsePage<${dependence}>`;
    addToFileDependence(fileName, "ResponsePage");
  } else if (dependenceList.includes("List")) {
    returnTypeString = `Response<${dependence}[]>`;
  } else if (dependence === "Result") {
    returnTypeString = `Response<any>`;
  } else {
    addToFileDependence(fileName, "Response");
    returnTypeString = `Response<${dependence}>`;
  }

  const noImportType = Object.keys(typeMap);
  if (dependence !== "Result" && !noImportType.includes(dependence))
    addToFileDependence(fileName, dependence);

  return {
    returnTypeString,
    dependence,
  };
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
      ?.filter((item) => item.name !== "token")
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
    const params = pathDetail.parameters?.filter(
      (item) => item.name !== "token"
    );
    if (params && params.length > 0) {
      const param = params[0];
      if (param.schema) {
        paramsString = `data: ${param.schema?.originalRef}`;
        // needInputList.push(param.schema!.originalRef);
        addToFileDependence(fileName, param.schema.originalRef);
      } else {
        // example: formData
        paramsString = `data: ${param.type}`;
      }
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
  if (
    pathDetail.responses[200].schema &&
    pathDetail.responses[200].schema.originalRef
  ) {
    const result = originalRefToType(
      fileName,
      pathDetail.responses[200].schema.originalRef
    );
    returnTypeString = result.returnTypeString;
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
    const relativePath = nodePath.relative(
      nodePath.resolve(GEN_API_DIR),
      nodePath.resolve(GEN_TYPE_DIR)
    );
    const dependenceResultString = `import type { ${dependenceString} } from "${relativePath}"`;
    const prevString = fs.readFileSync(computedFilePath);
    fs.writeFileSync(computedFilePath, dependenceResultString);
    fs.appendFileSync(computedFilePath, prevString);
  }
}

function getInitTypeContent() {
  return `
export interface ResponsePage<T> {
  code: number; //	状态码	integer(int32)	integer(int32)
  data: {
    pages: number; //		integer(int64)
    size: number; //		integer(int64)
    total: number; //		integer(int64)
    records: T[];
  }; //	结果集	CosCredentialVo	CosCredentialVo
  message: string; //	状态文本	string
  requestNo: string; //	请求流水号	string
}

export interface Response<T> {
  code: number; //	状态码	integer(int32)	integer(int32)
  data: T; //	结果集	CosCredentialVo	CosCredentialVo
  message: string; //	状态文本	string
  requestNo: string; //	请求流水号	string
}
  `;
}

/**
 * 生成类型
 */
function genType(apiJSON: IApiJSON) {
  if (!fs.existsSync(GEN_TYPE_DIR)) {
    fs.mkdirSync(GEN_TYPE_DIR);
  }
  // type文件默认写入Response和ResponsePage
  fs.writeFileSync(
    nodePath.resolve(GEN_TYPE_DIR, "index.ts"),
    getInitTypeContent()
  );

  // 获取搜索需要声明的类型
  let typeList: string[] = [];
  for (let dependenceSet of fileDependence.values()) {
    // 从每个文件中获取需要的类型，push到typeList中
    typeList = typeList.concat(...dependenceSet);
  }
  console.log("typeList", typeList);
  try {
    for (let key in apiJSON.definitions) {
      // 遍历所有定义的类型 对在typeList中的类型进行处理
      if (typeList.includes(key)) {
        const value = apiJSON.definitions[key];
        // 属性是否必填
        const requiredList = value.required;
        let propertyString = "";
        for (let propertyKey in value.properties) {
          const propertyValue = value.properties[propertyKey];
          let type: string;
          if ("items" in propertyValue) {
            if ("originalRef" in propertyValue.items) {
              type = `Array<${propertyValue.items.originalRef}>`;
              if (!typeList.includes(propertyValue.items.originalRef ?? "")) {
                // 引用了其他类型，将类型添加到dependence中，抛出错误重新开始处理
                addToFileDependence(
                  "other",
                  propertyValue.items.originalRef ?? ""
                );
                throw new Error("interface not found");
              }
            } else {
              type = `Array<${typeMap[propertyValue.items.type]}>`;
            }
          } else if ("enum" in propertyValue) {
            type = propertyValue.enum.map((item) => `"${item}"`).join(" | ");
          } else if ("originalRef" in propertyValue) {
            const result = originalRefToType(
              "other",
              propertyValue.originalRef
            );
            type = result.returnTypeString;
            if (!typeList.includes(result.dependence)) {
              throw new Error("interface not found");
            }
          } else {
            type = typeMap[propertyValue.type];
          }
          // 没有返回requiredList字段的默认都为必填
          propertyString += `  ${propertyKey}${
            requiredList?.includes(propertyKey) ? "?" : ""
          }: ${type};\n`;
        }
        const title = value.title.replace(/[^A-Za-z0-9\U4e00-\u9fa5_]/g, "_");
        const content = `
export interface ${title} {
${propertyString}}
      `;
        fs.appendFileSync(nodePath.resolve(GEN_TYPE_DIR, "index.ts"), content);
      }
    }
  } catch (err: any) {
    if (err.message === "interface not found") {
      genType(apiJSON);
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
    } else if ("delete" in path) {
      pathTag = path.delete.tags.join("");
      requestType = "post";
      pathDetail = path.delete;
    } else if ("put" in path) {
      pathTag = path.put.tags.join("");
      requestType = "post";
      pathDetail = path.put;
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
