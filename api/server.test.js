const request = require('supertest')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const server = require('./server')
const db = require('../data/dbConfig')

const jokes = require('./jokes/jokes-data')
const { jwtSecret } = require('../data/secrets')

// Write your tests here
test('sanity', () => {
    expect(true).toBe(true)
})
describe('Server tests', () => {
    afterAll(async () => {
        await db.destroy()
    })
    describe('Auth API', () => {
        describe('Register', () => {
            beforeEach(async () => {
                await db('users').truncate()
            })
            afterAll(async () => {
                await db('users').truncate()
            })
            const url = '/api/auth/register'

            test('client must provide `username` and `password`', async () => {
                const badBody1 = { username: 'Bob' }
                const badBody2 = {}
                const badBody3 = { username: 'Bob', password: 2 }

                let res

                res = await request(server)
                    .post(url)
                    .send(badBody1)
                expect(res.body).toBe("username and password required")

                res = await request(server)
                    .post(url)
                    .send(badBody2)
                expect(res.body).toBe("username and password required")

                res = await request(server)
                    .post(url)
                    .send(badBody3)
                expect(res.body).toBe("username and password required")
            })
            test('on successful registration, correct response is returned', async () => {
                const body = { username: 'Jimmy John', password: 'pass123' }

                const res = await request(server)
                    .post(url)
                    .send(body)
                const { id, username, password } = res.body
                expect({ id, username }).toEqual({ id: 1, username: 'Jimmy John' })
                expect(bcrypt.compareSync('pass123', password)).toBe(true)
            })
            test('if username already exists, correct response is returned', async () => {
                const body = { username: 'Jimmy John', password: 'pass123' }
                await request(server)
                    .post(url)
                    .send(body)
                const res = await request(server)
                    .post(url)
                    .send(body)
                expect(res.body).toBe("username taken")
            })
        })
        describe('Login', () => {
            const loginBody = { username: 'Jimmy John', password: 'pass123' }
            beforeAll(async () => {
                const body = { username: loginBody.username, password: bcrypt.hashSync(loginBody.password) }
                await db('users')
                    .insert(body)
            })
            afterAll(async () => {
                await db('users').truncate()
            })
            const url = '/api/auth/login'

            test('client must provide `username` and `password`', async () => {
                const badBody = { username: 'Bob' }

                const res = await request(server)
                    .post(url)
                    .send(badBody)
                expect(res.body).toBe("username and password required")
            })
            test('on successful login, correct response is returned', async () => {
                const res = await request(server)
                    .post(url)
                    .send({ username: 'Jimmy John', password: 'pass123' })
                const { message, token } = res.body
                expect(message).toBe("welcome, Jimmy John")
                expect(token).toBeDefined()
                jwt.verify(token, jwtSecret, (err, decoded) => {
                    expect(err).toBeFalsy()
                })
            })
            test('on failed login due to bad credentials, correct response is returned', async () => {
                const badUsernameBody = { username: 'Tim', password: 'nope' }
                const badPasswordBody = { ...loginBody, password: 'incorrect' }

                let res = await request(server)
                    .post(url)
                    .send(badUsernameBody)
                expect(res.body).toBe("invalid credentials")
                res = await request(server)
                    .post(url)
                    .send(badPasswordBody)
                expect(res.body).toBe("invalid credentials")
            })
        })
    })
    describe('Jokes API', () => {
        describe('Get', () => {
            const loginBody = { username: 'Jimmy John', password: 'pass123' }
            beforeAll(async () => {
                const body = { username: loginBody.username, password: bcrypt.hashSync(loginBody.password) }
                await db('users')
                    .insert(body)
            })
            afterAll(async () => {
                await db('users').truncate()
            })
            const url = '/api/jokes'

            test('authenticated users get the correct response', async () => {
                // get a token
                let res = await request(server)
                    .post('/api/auth/login')
                    .send(loginBody)
                const { token } = res.body
                // do the test
                res = await request(server)
                    .get(url)
                    .set('Authorization', token)
                expect(res.body).toEqual(jokes)
            })
            test('non-authenticated users get the correct response', async () => {
                // don't include a token
                let res = await request(server)
                    .get(url)
                expect(res.body).toBe("token required")
                // include a bad token
                res = await request(server)
                    .get(url)
                    .set('Authorization', 'badToken')
                expect(res.body).toBe("token invalid")
            })
        })
    })
})