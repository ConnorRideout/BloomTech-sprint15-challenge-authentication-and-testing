function checkValidUser(req, res, next) {
    const { username, password } = req.body
    if (!username || typeof username !== 'string' || !username.trim() ||
        !password || typeof password !== 'string' || !password.trim()) {
        next({ status: 422, message: "username and password required" })
    }
    next()
}

module.exports = {
    checkValidUser
}