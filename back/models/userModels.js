const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    userName: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    password: {
        type: String,
        require: true
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('user', userSchema);