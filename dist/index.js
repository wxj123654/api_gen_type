"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const gen_1 = require("./gen");
const get_1 = require("./get");
const API_JSON_BASE_LINK_ADDRESS = "http://101.34.2.112:9700";
const API_CATEGORY_LINK_ADDRESS = "http://101.34.2.112:9700/swagger-resources";
const CATEGORY_NAME = "后台管理系统";
let categoryList;
let apiJson;
const getApiJSON = (url) => __awaiter(void 0, void 0, void 0, function* () {
    return yield (0, get_1.getResponse)(url);
    // console.log("getApiResponse Result ", result);
});
const gen_by_category = () => __awaiter(void 0, void 0, void 0, function* () {
    const specifiedCategory = categoryList.find((item) => item.name === CATEGORY_NAME);
    if (specifiedCategory) {
        const result = (yield getApiJSON(API_JSON_BASE_LINK_ADDRESS + specifiedCategory.url));
        console.log("apiJSonResult", result);
        apiJson = result;
        (0, gen_1.gen)(apiJson);
    }
    else {
        throw new Error("未找到指定的分类");
    }
});
const getApiCategory = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield (0, get_1.getResponse)(API_CATEGORY_LINK_ADDRESS);
    categoryList = result;
    console.log("getApiResponse Result ", result);
});
const generate = () => __awaiter(void 0, void 0, void 0, function* () {
    yield getApiCategory();
    yield gen_by_category();
});
generate();
