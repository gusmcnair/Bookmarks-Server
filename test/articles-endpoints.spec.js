const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures.js')
const testBookmarks = makeBookmarksArray()

describe('bookmarks endpoints', function () {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks_table').truncate())

    afterEach('cleanup', () => db('bookmarks_table').truncate())

    context('given malicious bookmark inserted', () => {

        const maliciousBookmark = {
            id: 911,
            title: 'Naughty naughty very naughty <script>alert("xss");</script>',
            url: 'www.internet.com',
            description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
            rating: 5
          }

        beforeEach('insert malicious bookmark', () => {
            return db
                .into('bookmarks_table')
                .insert([maliciousBookmark])
        })
       
        it('removes xss attack content when getting all bookmarks', () => {
            return supertest(app)
                .get('/bookmarks')
                .expect(res => {
                    expect(res.body[0].title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                    expect(res.body[0].description).to.eql('Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.')
                })
        }) 

        it('removes xss attack content when posting article', () => {
            return supertest(app)
                .post('/bookmarks')
                .send(maliciousBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                    expect(res.body.description).to.eql('Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.')
                          })
        })

        it('removes xss attack when getting a specific bookmark', () => {
            return supertest(app)
                .get(`/bookmarks/${maliciousBookmark.id}`)
                .expect(res => {
                        expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                        expect(res.body.description).to.eql('Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.')
                    })
                })


    }) 

    context('given there are bookmarks in the db', () => {

        beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks_table')
                .insert(testBookmarks)
        })

        it('get bookmarks responds with 200 and all the bookmarks', () => {
            return supertest(app)
                .get('/bookmarks')
                .expect(200, testBookmarks)
        })

        it('get bookmarks/bookmark responds with 200 and the bookmark', () => {
            const bookmarkId = 2
            const expectedBookmark = testBookmarks[1]
            return supertest(app)
                .get(`/bookmarks/${bookmarkId}`)
                .expect(200, expectedBookmark)
        })

        it('responds with 204 and removes the bookmark', () => {
            const idToRemove = 2
            const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
            return supertest(app)
                .delete(`/bookmarks/${idToRemove}`)
                .expect(204)
                .then(res =>
                    supertest(app)
                        .get(`/bookmarks`)
                        .expect(expectedBookmarks))
        })

    })

    context('post new bookmark2', () => {

        it('creates a bookmark, responding with 201 and the bookmark', function() {
            const newBookmark = {
                id: 5,
                title: 'Glamor Rabbit',
                url: 'www.internet.com',
                description: `hello, it's me, the space governor`,
                rating: 5
            }
            return supertest(app)
                .post('/bookmarks')
                .send(newBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
                })
                .then(res =>
                    supertest(app)
                    .get(`/bookmarks/${res.body.id}`)
                    .expect(res.body)
                    )
        })

    })

    context('post new bookmark', () => {

        beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks_table')
                .insert(testBookmarks)
        })

        const ratingErrorBookmark = {
            title: 'title',
            url: 'url.com',
            rating: 'flurg',
        }

        const urlErrorBookmark = {
            title: 'title',
            url: 'hello',
            rating: 3,
        }

        it(`responds with an error if rating is invalid`, () => {
            return supertest(app)
                .post('/bookmarks')
                .send(ratingErrorBookmark)
                .expect(400, {
                    error: {message: `Invalid rating input. Rating must be a number between 1 and 5.`}
                })
        })

        it(`responds with an error if url is invalid`, () => {
            return supertest(app)
                .post('/bookmarks')
                .send(urlErrorBookmark)
                .expect(400, {
                    error: {message: `Invalid url.`}
                })
        })

        const requiredFields = ['title', 'url', 'rating']

        requiredFields.forEach(field => {
            const newBookmark = {
                title: 'title',
                url: 'url.com',
                rating: 3
            }

            it(`responds with 400 and an error message when ${field} is missing`, () => { 
                delete newBookmark[field]

            return supertest(app)
                .post('/bookmarks')
                .send(newBookmark)
                .expect(400, {
                    error: {message: `Missing ${field} in request body.`}
                })
            })
        })
    })

    context('given no bookmarks', () => {
        it(`responds with 200 and an empty list`, () => {
            return supertest(app)
                .get('/bookmarks')
                .expect(200, [])
        })

        it(`responds with 404 if delete bookmark doesn't exist`, () => {
            const bookmarkId = 12321321
            return supertest(app)
                .delete(`/bookmarks/${bookmarkId}`)
                .expect(404, {error: {message: `bookmark doesn't exist`}})
        })

        it('responds with 404 and an error message', () => {
            const bookmarkId = 12312312
            return supertest(app)
                .get(`/bookmarks/${bookmarkId}`)
                .expect(404, { error: { message: `bookmark doesn't exist` } })
        })
    })

}) 