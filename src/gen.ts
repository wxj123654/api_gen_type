import fs from "fs";
import nodePath from "path";
import { GEN_API_DIR } from ".";
import { ITag, ITagFileMap, IPath, IApiJSON, IPathDetail } from "./type";

function genFile(tags: ITag[]) {
  if (!fs.existsSync(GEN_API_DIR)) {
    fs.mkdirSync(GEN_API_DIR);
  }
  const tagFileMapList:ITagFileMap[] =  tags.map((item) => {
    const fileNameList = item.description.split(" ");
    const fileName =
      fileNameList
        .slice(0, fileNameList.length - 1)
        .map((item) => item.toLocaleLowerCase())
        .join("_") + ".ts";
    
    fs.writeFileSync(nodePath.resolve(GEN_API_DIR, fileName), "");
    return {
      fileName,
      tagName: item.name
    }
  });
  return tagFileMapList
}

function genContent(url: string,pathDetail:IPathDetail,type: 'get' | 'post') {
  // 排除掉token、
  // TODO 读取配置文件根据配置文件来排除掉某一些属性
  // TODO item.in 为body的时候会有对于的实体类，找到实体类生成对应的字符串
  let paramsString = ''
  pathDetail.parameters.filter(item => item.name !== 'token').forEach(item => {
    if(paramsString !== "") paramsString += ','
    paramsString = paramsString + `"${item.name}"${item.required ? "": "?"}: ${item.in}`
  })

 
  const content =  `
  // ${pathDetail.description}
  export function ${pathDetail.operationId}({${paramsString}}) {
   return request.${type}("${url}",{})
  }
`

  return content
}

export function gen(apiJSON: IApiJSON) {
  const tags = apiJSON.tags;
  console.log("tags", tags);
  /**
   * ITag
   * description: "Page Config Controller"
   * name: "前端首页模块"
   */
  const tagFileMapList = genFile(tags)
  
  /**
   * path.get | path.post tags只有一个 匹配上面的文件生成内容写入到文件内
   */
  const apiPaths = apiJSON.paths
  for (let  url  in apiPaths)   {
    const path = apiPaths[url]
    let pathTag:string;
    let requestType: 'get' | 'post'
    let pathDetail: IPathDetail
    if('get' in path) {
        pathTag =  path.get.tags.join('')
        requestType = 'get'
        pathDetail = path.get
    } else {
        pathTag =  path.post.tags.join('')
        requestType = 'post'
        pathDetail = path.post
    }
    const tagFileMap = tagFileMapList.find(item => item.tagName === pathTag )
    if(tagFileMap) {
    const content = genContent(url,pathDetail,requestType)
      fs.appendFileSync(nodePath.resolve(GEN_API_DIR, tagFileMap.fileName), content);
    } else {
      console.log("tagFile not found!!!")
    }
  }


}
