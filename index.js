const express = require('express');
const api = require('./api');
const PORT = process.env.PORT || 3000;

const app = express();

app.get('/api', api);
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
