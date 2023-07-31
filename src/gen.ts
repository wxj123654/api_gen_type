import fs from "fs";
import path from "path";

export function gen(apiJSON: IApiJSON) {
  const tags = apiJSON.tags;
  console.log("tags", tags);
  /**
   * ITag
   * description: "Page Config Controller"
   * name: "前端首页模块"
   */
  if (!fs.existsSync("gen")) {
    fs.mkdirSync("gen");
  }
  tags.forEach((item) => {
    const fileNameList = item.description.split(" ");
    const fileName =
      fileNameList
        .slice(0, fileNameList.length - 1)
        .map((item) => item.toLocaleLowerCase())
        .join("_") + ".ts";

    fs.writeFileSync(path.resolve("gen", fileName), "");
  });
}
