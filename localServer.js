const express = require('express');
const app = express();
const fs = require("fs");
const customHeadersAppLevel = function (req, res, next) {
    res.append("Cross-Origin-Embedder-Policy", "require-corp");
    res.append("Cross-Origin-Opener-Policy", "same-origin");
    next();
 };
 app.use(customHeadersAppLevel);
app.use(express.static(__dirname + '/dist'));
if (fs.existsSync("key.pem") && fs.existsSync("cert.pem")) {
    require("https").createServer({
        key: fs.readFileSync("key.pem", "utf-8"),
        cert: fs.readFileSync("cert.pem", "utf-8")
    }, app).listen(3000, () => console.log('Listening on port 3000'));    
} else {
    app.listen(3000, () => console.log('Listening on port 3000'));
}
