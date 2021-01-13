import express from 'express';
import { getAllImages } from '../client.js';
import fetch from 'node-fetch'




const createRouter = function (collection, countiesCollection) {
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



  router.get("/populate-img-data", (req, res) => {
    // 1. populate is going to fetch the data from the public api, 1 fetch per county
    countiesCollection
      .find()
      .toArray()
      .then((doc) => {
        // For now, fetch two, filter down, then call our fetch photos
        const filteredDoc = doc.filter((county, index) => {
          return index < 2
        })
        doc.forEach(county => {
          getAllImages(county.logainmID)
          .then(data => {
            // fetch each url by ref num, catch errors and exclude from filter if error
            const filteredData = data.filter((photo, index) => {
              const url = `https://doras.gaois.ie/cbeg/${photo.referenceNumber}.jpg?format=jpg&width=620&quality=85`
              return fetch(url)
              .then((resp) => {
                return resp.ok
              })
            })
            collection
            .insertMany(filteredData)
            .then((result) => {
              res.status(200)
              res.json({ status: 200});
            })
            .catch((err) => {
              console.error(err);
              res.status(500);
              res.json({ status: 500, error: err });
            });
          })
        });
      })
    //  1.5. filter out "blacklisted" items [broken images]

    // 2. gonna store that data in the db
  })




  return router;
};
export default createRouter;
