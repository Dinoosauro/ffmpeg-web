const express = require('express');
const app = express();
const customHeadersAppLevel = function (req, res, next) {
    res.append("Cross-Origin-Embedder-Policy", "require-corp");
    res.append("Cross-Origin-Opener-Policy", "same-origin");
    next();
 };
 app.use(customHeadersAppLevel);
app.use(express.static(__dirname + '/dist'));
app.listen(3000, () => console.log('Listening on port 3000'));
