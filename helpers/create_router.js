import express from 'express';
import { getAllImages } from '../client.js';
import fetch from 'node-fetch'

// import request from 'request-promise';
import axios from 'axios';


const AGENT_HEADER = "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36";
const ACCEPT_HEADER = "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"



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



  router.get("/populate", (req, res) => {
    // 1. populate is going to fetch the data from the public api, 1 fetch per county
    let results = [];
    countiesCollection
      .find()
      .toArray()
      .then((doc) => {
        // For now, fetch two, filter down, then call our fetch photos
        const filteredDoc = doc.filter((county, index) => {
          return index < 2
        })


        filteredDoc.forEach(county => {
          getAllImages(county.logainmID)
          .then(data => {
            // fetch each url by ref num, catch errors and exclude from filter if error
            let requests = data.map(photo => axios.get(`https://doras.gaois.ie/cbeg/${photo.referenceNumber}.jpg?format=jpg&width=620&quality=85`));

            Promise.all(requests)
             .then((results)=>{
               let filteredData  = results.map((result, index)=>{
                 let elm = data[index]
                 let obj = {...elm, availableResult: result.status}
                 return  obj
               })
               .filter(result => {
                 return result.availableResult === 200
                });
            
              // console.log(filteredData);
                collection
                .insertMany(filteredData)
                .then((result) => {
                  // res.status(200);
                  // res.json({ status: 200});
                })
                .catch((err) => {
                  console.error(err);
                  res.status(500);
                  res.json({ status: 500, error: err });
                });
            }).catch((err)=>console.log(""))
          })
        });
      })
    //  1.5. filter out "blacklisted" items [broken images]
    res.status(200);
    res.json({ status: 200});

    // 2. gonna store that data in the db
  })




  return router;
};
export default createRouter;
