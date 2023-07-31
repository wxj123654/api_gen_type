import http from "http";

export function getResponse(url: string) {
  return new Promise((resolve, reject) => {
    http
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
