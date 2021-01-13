import express from 'express';
import { getAllCounties, getAllImages } from '../client.js';



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

  router.get("/populate-counties", (req, res) => {
    // 1. populate is going to fetch the data from the public api
    // 2. Save that to db under "counties" collection
    
  })

  router.get("/populate-img-data", (req, res) => {
    // 1. populate is going to fetch the data from the public api, 1 fetch per county
    
    //  1.5. filter out "blacklisted" items [broken images]
    // 2. gonna store that data in the db
  })




  return router;
};
export default createRouter;
