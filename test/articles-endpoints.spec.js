const { expect } = require('chai')
const knex = require('knex')
const app = require ('../src/app')
const {makeBookmarksArray} = require('./bookmarks.fixtures.js')

describe.only('bookmarks endpoints', function (){
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

    context('given there are bookmarks in the db', () => {

       const testBookmarks = makeBookmarksArray()

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

    })

    context('given no bookmarks', () => {
        it(`responds with 200 and an empty list`, () => {
            return supertest(app)
                .get('/bookmarks')
                .expect(200, [])
        })

        it('responds with 404 and an error message', () => {
            const bookmarkId = 12312312
            return supertest(app)
                .get(`/bookmarks/${bookmarkId}`)
                .expect(404, {error: {message: `Bookmark doesn't exist.`}})
        })
    })

})