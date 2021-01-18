import express from 'express';
import { getAllImages } from '../client.js';

import axios from 'axios';


const AGENT_HEADER = "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36";
const ACCEPT_HEADER = "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"

const deletePhotoDoc = (id, collection, exceptionNum) =>{
  console.log(`${exceptionNum} - removing document with id: ${id} `)
  collection.remove({id: id})
}

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

  router.get("/wan", (req, res)=>{
    const url = 'https://doras.gaois.ie/cbeg/B009.13.00007.jpg?format=jpg&width=620&quality=85';
    console.log("fetching url: ", url);
    axios.get(url)
    .then((result)=>{
      console.log(result.status);
    })
    res.send("hokay")
  })

  router.get("/clean", (req, res)=>{
    collection.find()
      .toArray()
      .then((doc) => {
        const filteredDoc = doc.filter((e, index) => {
          return index < 5000
        })
        // change filteredDoc to doc to do entire data set
        let requests = doc.map((photo, index) => axios.get(
          `https://doras.gaois.ie/cbeg/${photo.referenceNumber}.jpg?format=jpg&width=620&quality=85`,
           {headers: { 'agent': AGENT_HEADER, 'Accept': ACCEPT_HEADER}}
          ).catch((err)=>{
            let elm = doc[index]; 
            deletePhotoDoc(elm.id, collection, 1);
          })  
        );
        let currIndex = 0;
        Promise.all(requests)
          .then((allPromiseResponses)=>{
            allPromiseResponses.forEach((result, index)=>{
              currIndex = index;
              // match a promise response with a document 
              let elm = doc[index]; 
              // if the result of that promise isn't 200 del the matching document?
              if (result.status !== 200){
                deletePhotoDoc(elm.id, collection, 2);
              }
            })
            res.send('alright');
          })
          .catch((err)=>{
              let elm = doc[currIndex]; 
              deletePhotoDoc(elm.id, collection, 3);
          })
       
      })
      .catch((err) => {
        // console.error(err);
        res.status(500);
        res.json({ status: 500, error: err });
      });
      // res.send("alright");
  })


  router.get("/populate", (req, res) => {
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
            if (data.length > 0){
                // console.log(filteredData);
                collection
                .insertMany(data)
                .then((result) => {
                  // res.status(200);
                  // res.json({ status: 200});
                })
                .catch((err) => {
                  console.error(err);
                  res.status(500);
                  res.json({ status: 500, error: err });
                });
              }
          })
        });
      })
    res.status(200);
    res.json({ status: 200});

  })




  return router;
};
export default createRouter;
