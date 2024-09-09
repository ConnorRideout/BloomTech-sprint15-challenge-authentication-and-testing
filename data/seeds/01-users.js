const bcrypt = require('bcryptjs')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = function (knex) {
    return knex('users').truncate()
        .then(() => {
            return knex('users').insert([
                { username: 'FriendCryden', password: bcrypt.hashSync('pass123') }
            ])
        })
};
