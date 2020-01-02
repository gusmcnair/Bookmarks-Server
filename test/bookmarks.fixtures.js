function makeBookmarksArray() {
    return [
        {
            id: 1,
            title: 'Test Bookmark One',
            url: 'www.google.com',
            description: 'Google, the famous website',
            rating: 4,
        },
        {
            id: 2,
            title: 'Test Bookmark Two',
            url: 'www.yahoo.com',
            description: 'Yahoo, the famous website',
            rating: 3,
        },
        {
            id: 3,
            title: 'Test Bookmark Three',
            url: 'www.hotmail.com',
            description: 'Hotmail, the famous website',
            rating: 2,
        }
    ]
}

module.exports = {
    makeBookmarksArray,
}