import { gen } from "./gen";
import { getResponse } from "./get";
import { IApiJSON, ICategory, IGenConfig } from "./type";
// 导出配置文件类型
export type { IGenConfig } from "./type";

// @ts-ignore 文件不存在会报错
const genConfig = require(`${process.cwd()}/gen.config.json`);

const config: IGenConfig = genConfig;

const BASE_URL = config.baseUrl;

const API_JSON_BASE_LINK_ADDRESS = BASE_URL;
const API_CATEGORY_LINK_ADDRESS = `${BASE_URL}/swagger-resources`;

export const GEN_API_DIR = config.genBase?.apiFileDir ?? "gen_api";
export const GEN_TYPE_DIR = config.genBase?.typeFileDir ?? "gen_type";

// const CATEGORY_NAME = "后台管理系统";
const CATEGORY_NAME = config.categoryName;

let categoryList: ICategory[];
let apiJson: IApiJSON;

const getApiJSON = async (url: string) => {
  return await getResponse(url);
  // console.log("getApiResponse Result ", result);
};
const gen_by_category = async () => {
  const specifiedCategory = categoryList.find(
    (item) => item.name === CATEGORY_NAME
  );
  if (specifiedCategory) {
    const result = (await getApiJSON(
      API_JSON_BASE_LINK_ADDRESS + specifiedCategory.url
    )) as unknown as IApiJSON;
    console.log("apiJSonResult", result);
    apiJson = result;
    gen(apiJson);
  } else {
    throw new Error(
      "未找到指定的分类，分类有" +
        JSON.stringify(categoryList.map((item) => item.name))
    );
  }
};
const getApiCategory = async () => {
  const result = await getResponse(API_CATEGORY_LINK_ADDRESS);
  categoryList = result as ICategory[];
  console.log("getApiResponse Result ", result);
};

const generate = async () => {
  await getApiCategory();
  await gen_by_category();
};

generate();
