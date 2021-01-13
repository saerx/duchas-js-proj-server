import express from 'express';
import { getAllCounties, getAllImages } from '../client.js';

const createCountiesRouter = function (collection) {
    const router = express.Router();

    router.get("/populate", (req, res) => {
        // 1. populate is going to fetch the data from the public api
        getAllCounties()
        .then(data => {
            collection
            .insertMany(data)
            .then((result) => {
              res.json(result.ops)
            })
            .catch((err) => {
              console.error(err);
              res.status(500);
              res.json({ status: 500, error: err });
            });
        })
        // 2. Save that to db under "counties" collection
        
    })

    return router;
}

export default createCountiesRouter;