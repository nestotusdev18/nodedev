const express = require('express');
const bodyParser = require('body-parser');

const product = require('./routes/product.route'); // Imports routes for the products
const app = express();

// Set up mongoose connection
const mongoose = require('mongoose');
let dev_db_url = 'mongodb://hari_pro:pro_hari123@ds149672.mlab.com:49672/login';
const mongoDB = process.env.MONGODB_URI || dev_db_url;

mongoose.connect("mongodb://hari_pro:pro_hari123@ds149672.mlab.com:49672/login", { useNewUrlParser: true });
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use('/products', product);

let port = 4000;

app.listen(port, () => {
    console.log('Server is up and running on port numner ' + port);
});