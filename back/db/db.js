const mongoose = require('mongoose')

exports.connectDB = async (req, res) => {
    try {
        await mongoose
            .connect(process.env.MONGODB_PATH)
            .then(() => console.log("DB IS Connected"))
    } catch (error) {
        console.log(error);
        return res.status(500).json({ statsu: 500, message: error.message })
    }
}