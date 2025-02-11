const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
    userName: { 
    type: String,
     required: true 
    },
  members: [
    { type: mongoose.Schema.Types.ObjectId,
         ref: "User" 
    }
], 
  createdAt: { 
    type: Date, 
    default: Date.now 
},
  isDeleted: { 
    type: Boolean, 
    default: false 
},
});

module.exports = mongoose.model("Group", groupSchema);
