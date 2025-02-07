const user = require('../models/userModels')
const jwt = require('jsonwebtoken')

exports.auth = async (req, res, next) => {
    try {
        let authorization = req.headers['authorization']

        if (authorization) {
            let token = await authorization.split(' ')[1]

            if (!token) {
                return res.status(404).json({ status: 404, message: "Token Is Required" })
            }

            let checkToken = jwt.verify(token, process.env.SECRET_KEY)

            let checkUser = await user.findById(checkToken)

            if (!checkUser) {
                return res.status(404).json({ status: 404, message: "User Not Found" })
            }

            req.user = checkUser

            next()
        }
        else {
            return res.status(404).json({ status: 404, message: "Token Is Required" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: 500, message: error.message })
    }
}