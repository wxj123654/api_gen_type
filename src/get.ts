import http from "http";
import https from "https";

export function getResponse(url: string) {
  return new Promise((resolve, reject) => {
    let method: typeof http | typeof https = http;
    if (url.startsWith("https")) {
      method = https;
    }
    method
      .get(url, (res) => {
        let list: any[] = [];
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
