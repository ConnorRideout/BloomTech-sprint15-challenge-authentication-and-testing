const db = require('../../data/dbConfig')

function findBy(filter) {
    return db('users')
        .where(filter)
        .first()
}

function add(user) {
    return db('users')
        .insert(user)
        .then(id => {
            return findBy({ id })
        })
}

module.exports = {
    findBy,
    add
}