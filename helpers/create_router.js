import express from 'express';
import { getAllImages } from '../client.js';

import pLimit from "p-limit"

import axios from 'axios';


const AGENT_HEADER = "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36";
const ACCEPT_HEADER = "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"

const deletePhotoDoc = (id, collection, exceptionNum, err) =>{

  /* :
  check the err object and decide what to do
    404 - delete
    403 - delete
    timeout - do nothing - shouldn't happen because using limit()
    EOnotfound - do nothing - shouldn't happen becuase using limit()
  */
  let error = null;

  if(err.response){
    error = err.response.status;
  }
  if (err.code){
    error = err.code;
  }

  if (exceptionNum === 3){
    console.log(err)
  }

  console.log(`${exceptionNum} - document with id: ${id} - error ${error} `)
  if (error === 404 || error == 403){
    console.log("removing it...")
    collection.remove({id: id})
    console.log("--------")
  }

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
    console.log("all done..")
    res.send("hokay")
  })

  router.get("/clean", (req, res)=>{
    // we'll use the limit() function to limit the number of simultanious axios.get's we
    // run at a time
    const limit = pLimit(3);

    // find **all** the photo documents
    collection.find()
      .toArray()
      .then((doc) => {
        // optional - filter them (for testing)
        const filteredDoc = doc.filter((e, index) => {
          return index < 1000
        })
       
        /*
          For all the returned photo objects (doc) map over them to create an array of promises
          This will issue a fetch (axios.get) for each photo document.
          But we'll use the limit() function from p-limit to force it to only do 3 at a time
        */
        let requests = doc.map((photo, index) => {
          console.log(`processing request ${index}..`)

          return limit(()=>{ // return the promise wrapping it in limit()
            return axios.get(
              `https://doras.gaois.ie/cbeg/${photo.referenceNumber}.jpg?format=jpg&width=620&quality=85`,
              {headers: { 'agent': AGENT_HEADER, 'Accept': ACCEPT_HEADER}}
              ).catch((err)=>{ 
                // if the promises we create fail - grab the index of the failing one and get
                // the corresponding  photo object.
                // Then pass that to the deletePhotoDoc function - it will check the err and decide if 
                // it should be deleted
                let elm = doc[index]; 
                deletePhotoDoc(elm.id, collection, 1, err);
              })  
          })
        });


        let currIndex = 0;
        Promise.all(requests)
          .then((allPromiseResponses)=>{
            console.log("all promises came back");
            allPromiseResponses.forEach((result, index)=>{
              console.log(`processing response ${index}...`)
              currIndex = index;
              // match a promise response with a document 
              let elm = doc[index]; 

            })
            res.status(200);
            res.json({ status: 200 }); // TODO: return stats on number of photo documents deleted etc
          })
          .catch((err)=>{  // it's possible that we'll come across problems here too
              let elm = doc[currIndex]; 
              deletePhotoDoc(elm.id, collection, 3, err);
          })
       
      })
      .catch((err) => { // catch any db exceptions and pass them back as a response
        res.status(500);
        res.json({ status: 500, error: err });
      });

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
