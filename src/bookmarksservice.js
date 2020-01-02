const BookmarksService = {
    getAllBookmarks(knex){
        return knex.select('*').from('bookmarks_table')
    },

    getById(knex, id){
        return knex.from('bookmarks_table').select('*').where('id', id).first()
    },
}

module.exports = BookmarksService