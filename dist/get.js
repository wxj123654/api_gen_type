"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResponse = void 0;
const http_1 = __importDefault(require("http"));
function getResponse(url) {
    return new Promise((resolve, reject) => {
        http_1.default
            .get(url, (res) => {
            let list = [];
            res.on("data", (chunk) => {
                list.push(chunk);
            });
            res.on("end", () => {
                const result = JSON.parse(Buffer.concat(list).toString());
                resolve(result);
            });
        })
            .on("error", (err) => {
            console.log("Error: ", err.message);
            reject(err);
        });
    });
}
exports.getResponse = getResponse;
