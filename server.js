import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pkg  from 'mongodb';
const { MongoClient } = pkg;
import createRouter from './helpers/create_router.js'
import createCountiesRouter from './helpers/counties_router.js'


const app = express();

app.use(cors());

// const bodyParser = require('body-parser');
// const MongoClient = require('mongodb').MongoClient;
// const createRouter = require('./helpers/create_router.js');

app.use(bodyParser.json());

MongoClient.connect('mongodb://127.0.0.1:27017')
  .then((client) => {
    const db = client.db('duchas');
    const photosCollection = db.collection('photos');
    const countiesCollection = db.collection('counties');
    const countiesRouter = createCountiesRouter(countiesCollection);
    const photosRouter = createRouter(photosCollection, countiesCollection);
    app.use('/api/photos', photosRouter);
    app.use('/api/counties', countiesRouter);
  })
  .catch(console.err);

app.listen(3001, function () {
  console.log(`Listening on port ${ this.address().port }`);
});
 