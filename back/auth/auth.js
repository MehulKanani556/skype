const user = require('../models/userModels')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

exports.userLogin = async (req, res) => {
    try {
        let { email, password } = req.body

        let checkEmailIsExist = await user.findOne({ email })

        if (!checkEmailIsExist) {
            return res.status(404).json({ status: 404, message: "Email Not found" })
        }

        let comparePassword = await bcrypt.compare(password, checkEmailIsExist.password)

        if (!comparePassword) {
            return res.status(404).json({ status: 404, message: "Password Not Match" })
        }

        let token = await jwt.sign({ _id: checkEmailIsExist._id }, process.env.SECRET_KEY, { expiresIn: "1D" })

        return res.status(200).json({ status: 200, message: "User Login SuccessFully...", user: checkEmailIsExist, token: token })
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 500, message: error.message })
    }
}
exports.googleLogin = async (req, res) => {
    try {
        let { uid, name, email } = req.body;
        let checkUser = await user.findOne({ email });
        if (!checkUser) {
            checkUser = await user.create({
                uid,
                name,
                email,
            });
        }
        checkUser = checkUser.toObject();
        let token = await jwt.sign({ _id: checkUser._id }, process.env.SECRET_KEY, { expiresIn: "1D" })
        // checkUser.token = generateToken(checkUser._id);
        return res.status(200).json({ message: 'login successful', success: true, user: checkUser, token: token });
    } catch (error) {
        throw new Error(error);
    }
};