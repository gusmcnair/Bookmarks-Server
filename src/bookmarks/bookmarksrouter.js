const express = require('express');
const BookmarksService = require('./bookmarksservice')
const xss = require('xss')
const jsonParser = express.json();
const logger = require('../logger')
const bookmarksRouter = express.Router()


const serializeBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: xss(bookmark.url),
    description: xss(bookmark.description),
    rating: bookmark.rating,
})

bookmarksRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res.json(bookmarks.map(serializeBookmark))
            })
            .catch(next)
    })


    .post(jsonParser, (req, res, next) => {
        const { title, url, description, rating } = req.body
        const newBookmark = { title, url, description, rating }
        const newBookmarkRequired = { title, url, rating }
        for(const [key, value] of Object.entries(newBookmarkRequired)){
        if (value == null) {
            return res.status(400).json({
                error: { message: `Missing ${key} in request body.` }
            })
        }}
        if(Number(newBookmark.rating) > 5 || Number(newBookmark.rating) < 1 || isNaN(Number(newBookmark.rating))){
            return res.status(400).json({
                error: {message: `Invalid rating input. Rating must be a number between 1 and 5.`}
            })
        }
        if(newBookmark.url.indexOf('.') === -1){
            return res.status(400).json({
                error: {message: `Invalid url.`}
            })
        }

        BookmarksService.insertBookmark(
            req.app.get('db'),
            newBookmark
        )
            .then(bookmark => {
                res
                    .status(201)
                    .location(`/bookmarks/${bookmark.id}`)
                    .json(serializeBookmark(bookmark))
            })
            .catch(next)
    })

bookmarksRouter
    .route('/:bookmark_id')
    .all((req, res, next) => {
        BookmarksService.getById(
            req.app.get('db'),
            req.params.bookmark_id
        )
    .then(bookmark => {
        if(!bookmark){
            return res.status(404).json({
                error: {message: `bookmark doesn't exist`}
            })
        }
        res.bookmark = bookmark
        next()
    })
    .catch(next)
})
    .get((req, res, next) => {
        res.json(serializeBookmark(res.bookmark))
    })
    .delete((req, res, next) => {
        BookmarksService.deleteBookmark(
            req.app.get('db'),
            req.params.bookmark_id)
        .then(() => {
            res.status(204).end()
        })
        .catch(next)
    })

module.exports = bookmarksRouter

