const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = 3000;

app.listen(PORT, function() {
    console.log(`Server started on port ${PORT}.`);
});