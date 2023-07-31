import { gen } from "./gen";
import { getResponse } from "./get";

const API_JSON_BASE_LINK_ADDRESS = "http://101.34.2.112:9700";
const API_CATEGORY_LINK_ADDRESS = "http://101.34.2.112:9700/swagger-resources";

const CATEGORY_NAME = "后台管理系统";

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
    throw new Error("未找到指定的分类");
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
