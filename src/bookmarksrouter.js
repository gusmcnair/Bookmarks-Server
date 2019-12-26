const express = require('express');
const uuid = require('uuid/v4');
const bookmarksRouter = express.Router();
const bodyParser = express.json();
const logger = require('./logger')

let bookmarks = [
    {
        name: "Google",
        url: "www.google.com",
        description: "Google, the well-known search engine",
        rating: 4,
        id: 77,
    }
]

bookmarksRouter
    .route('/bookmarks')
    .get((req, res) => {
        res.json(bookmarks)
    })
    .post(bodyParser, (req, res) => {
        const{title, url, description, rating} = req.body;

        if(!title){
            logger.error("Title is required");
            return res.status(400).send('Invalid data')
        }

        if(!url){
            logger.error("URL is required");
            return res.status(400).send('Invalid data')
        }

        if(!description){
            logger.error("Description is required");
            return res.status(400).send('Invalid data')
        }

        if(!rating){
            logger.error("Description is required");
            return res.status(400).send('Invalid data')
        }

        const id = uuid();
        
        const newBookmark = {title, url, description, rating, id};

        bookmarks.push(newBookmark)

        logger.info(`Card with id ${id} created.`)

        res
            .status(201)
            .location(`http://localhost:8000/card/${id}`)
            .json(newBookmark)
    })

    bookmarksRouter
        .route('/bookmarks/:id')
        .get((req, res) => {
            const {id} = req.params;
            const individualBookmark = bookmarks.find(bookmark => bookmark.id == id)

            if(!individualBookmark){
                logger.error('Bookmark with that id not found.')
                return res
                    .status(404)
                    .send('Bookmark not found.')
            }
            res.json(individualBookmark)
        })

        .delete((req, res) => {
            const {id} = req.params
            const individualBookmark = bookmarks.find(bookmark => bookmark.id == id)

            if(!individualBookmark){
                logger.error('Bookmark with that id not found.')
                return res
                    .status(404)
                    .send('Bookmark not found.')
            }

                for(let i = 0; i < bookmarks.length; i++){
                    if(bookmarks[i].id == id){
                        bookmarks.splice(i, 1)
                    }
                }

                logger.info(`card with id ${id} deleted`)
                res          
                .status(204)
                .end();
        })

    module.exports = bookmarksRouter