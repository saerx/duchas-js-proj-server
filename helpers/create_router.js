const express = require('express');
const ObjectID = require('mongodb').ObjectID;
const createRouter = function (collection) {
  const router = express.Router();
  router.get('/', (req, res) => {
    collection
      .find()
      .toArray()
      .then((docs) => res.json(docs))
      .catch((err) => {
        console.error(err);
        res.status(500);
        res.json({ status: 500, error: err });
      });
  });
  router.get('/:countyID/:startYear/:endYear', (req, res) => {
    const countyID = req.params.countyID;
    const startYear = req.params.startYear;
    const endYear = req.params.endYear;
    collection
      .find({
          "counties.logainmID": parseInt(countyID),
          "date.year": {$gte:parseInt(startYear), $lte:parseInt(endYear)
          }
        })
      .toArray()
      .then((doc) => res.json(doc))
      .catch((err) => {
        console.error(err);
        res.status(500);
        res.json({ status: 500, error: err });
      });
  });
  return router;
};
module.exports = createRouter;
// 