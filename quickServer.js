const http = require('http');
const host = 'localhost';
const port = 8500;
let ciao = function (req, response) {
  response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (req.url.endsWith(".js")) response.setHeader("Content-Type", "application/javascript");
  response.writeHead(200);
  if (req.url.indexOf("favicon.ico") !== -1 || req.url === "" || req.url === "/") response.end(""); else response.end(require("fs").readFileSync(req.url.replace("/", "")));
  console.log(req.url);
};
const server = http.createServer(ciao);
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});

