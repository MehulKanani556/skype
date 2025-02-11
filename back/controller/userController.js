const user = require("../models/userModels");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const message = require("../models/messageModel");

exports.createUser = async (req, res) => {
  try {
    let { userName, email, password } = req.body;

    let checkExistUser = await user.findOne({ email });

    if (checkExistUser) {
      return res
        .status(409)
        .json({ status: 409, message: "User Already Exist..." });
    }

    let salt = await bcrypt.genSalt(10);
    let hashPassword = await bcrypt.hash(password, salt);

    checkExistUser = await user.create({
      userName,
      email,
      password: hashPassword,
    });
    let token = await jwt.sign(
      { _id: checkExistUser._id },
      process.env.SECRET_KEY,
      { expiresIn: "1D" }
    );
    return res.status(201).json({
      status: 201,
      message: "User Created SuccessFully...",
      user: checkExistUser,
      token: token,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    let pageSize = parseInt(req.query.pageSize);

    if (page < 1 || pageSize < 1) {
      return res.status(401).json({
        status: 401,
        message: "Page And PageSize Cann't Be Less Than 1",
      });
    }

    let paginatedUser;

    paginatedUser = await user.find();

    let count = paginatedUser.length;

    if (count === 0) {
      return res.status(404).json({ status: 404, message: "User Not Found" });
    }

    if (page && pageSize) {
      let startIndex = (page - 1) * pageSize;
      let lastIndex = startIndex + pageSize;
      paginatedUser = await paginatedUser.slice(startIndex, lastIndex);
    }

    return res.status(200).json({
      status: 200,
      totalUsers: count,
      message: "All Users Found SuccessFully...",
      users: paginatedUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

exports.getAllMessageUsers = async (req, res) => {
    try {
        let getAllMessageUsers = await message.aggregate([
            {
              $match: { $or: [{ sender: req.user._id }, { receiver: req.user._id }] }
            },
            {
              $project: { user: { $cond: [{ $eq: ["$sender", req.user._id] }, "$receiver", "$sender"] } }
            },
            {
              $group: { _id: "$user" }
            },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userData"
              }
            },
            { $unwind: "$userData" },
            {
              $project: { _id: 1, userName: "$userData.userName", email: "$userData.email",createdAt: "$userData.createdAt" }
            },
            // New stage to include the logged-in user
            {
              $unionWith: {
                coll: "users",
                pipeline: [
                  {
                    $match: { _id: req.user._id }
                  },
                  {
                    $project: { _id: 1, userName: "$userName", email: "$email",createdAt: "$createdAt" }
                  }
                ]
              }
            }
          ]);
    
        return res.status(200).json({
          status: 200,
          message: "All Message Users Found Successfully...",
          users: getAllMessageUsers
        });
    
      } catch (error) {
        console.log(error);
        return res.status(500).json({ status: 500, message: error.message });
      }
};
