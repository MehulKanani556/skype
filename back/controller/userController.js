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

// exports.getAllMessageUsers = async (req, res) => {

//   try {
//     const pipeline = [
//       // Match messages where user is either sender or receiver
//       {
//         $match: {
//           $or: [
//             { sender: req.user._id },
//             { receiver: req.user._id }
//           ]
//         }
//       },

//       // Project to get the other user in the conversation
//       {
//         $project: {
//           user: {
//             $cond: {
//               if: { $eq: ["$sender", req.user._id] },
//               then: "$receiver",
//               else: "$sender"
//             }
//           }
//         }
//       },

//       // Group by user to remove duplicates
//       {
//         $group: {
//           _id: "$user"
//         }
//       },

//       // Lookup user details
//       {
//         $lookup: {
//           from: "users",
//           localField: "_id",
//           foreignField: "_id",
//           as: "userData"
//         }
//       },

//       // Unwind user data
//       {
//         $unwind: "$userData"
//       },

//       // Project required user fields
//       {
//         $project: {
//           _id: 1,
//           userName: "$userData.userName",
//           email: "$userData.email",
//           createdAt: "$userData.createdAt"
//         }
//       },

//       // Union with current user's data
//       {
//         $unionWith: {
//           coll: "users",
//           pipeline: [
//             {
//               $match: {
//                 _id: req.user._id
//               }
//             },
//             {
//               $project: {
//                 _id: 1,
//                 userName: 1,
//                 email: 1,
//                 createdAt: 1
//               }
//             }
//           ]
//         }
//       },

//       // Group again to remove potential duplicates
//       {
//         $group: {
//           _id: "$_id",
//           userName: { $first: "$userName" },
//           email: { $first: "$email" },
//           createdAt: { $first: "$createdAt" }
//         }
//       },

//       // Lookup group information
//       {
//         $lookup: {
//           from: "groups",
//           localField: "_id",
//           foreignField: "members",
//           as: "groupData"
//         }
//       },

//       // Unwind group data (preserve users without groups)
//       {
//         $unwind: {
//           path: "$groupData",
//           preserveNullAndEmptyArrays: true
//         }
//       },

//       // Lookup messages for each user (both sent and received) with specific statuses
//       {
//         $lookup: {
//           from: "messages", // Assuming the messages collection is named "messages"
//           let: { userId: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     {
//                       $or: [
//                         { $eq: ["$sender", "$$userId"] },
//                         { $eq: ["$receiver", req.user._id] }
//                       ]
//                     },
//                     {
//                       $or: [
//                         { $eq: ["$status", "sent"] },
//                         { $eq: ["$status", "delivered"] }
//                       ]
//                     }
//                   ]
//                 }
//               }
//             }
//           ],
//           as: "userMessages"
//         }
//       },

//       // Final projection with user messages
//       {
//         $project: {
//           _id: 1,
//           userName: 1,
//           email: 1,
//           createdAt: 1,
//           group: {
//             groupId: { $ifNull: ["$groupData._id", null] },
//             groupName: { $ifNull: ["$groupData.userName", null] },
//             groupCreatedAt: { $ifNull: ["$groupData.createdAt", null] }
//           },
//           messages: "$userMessages" // Include messages in the response
//         }
//       }
//     ];

//     const results = await message.aggregate(pipeline);

//     // Format the response
//     const formattedUsers = results.map(user => ({
//       _id: user._id,
//       userName: user.userName,
//       email: user.email,
//       createdAt: user.createdAt,
//       group: user.group.groupId ? user.group : null,
//       messages: user.messages // Include messages in the response
//     }));

//     // Extract unique groups
//     const uniqueGroups = Array.from(new Set(results
//       .filter(user => user.group.groupId)
//       .map(user => JSON.stringify({
//         _id: user.group.groupId,
//         userName: user.group.groupName,
//         createdAt: user.group.groupCreatedAt
//       }))
//     )).map(group => JSON.parse(group));

//     return res.status(200).json({
//       status: 200,
//       message: "All Message Users and Groups Found Successfully...",
//       users: [...formattedUsers, ...uniqueGroups]
//     });

//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       status: 500,
//       message: error.message
//     });
//   }
// };



exports.getAllMessageUsers = async (req, res) => {
  try {
    const pipeline = [
      // Match messages where user is either sender or receiver
      {
        $match: {
          $or: [{ sender: req.user._id }, { receiver: req.user._id }],
        },
      },

      // Project to get the other user in the conversation
      {
        $project: {
          user: {
            $cond: {
              if: { $eq: ["$sender", req.user._id] },
              then: "$receiver",
              else: "$sender",
            },
          },
        },
      },

      // Group by user to remove duplicates
      {
        $group: {
          _id: "$user",
        },
      },

      // Lookup user details
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userData",
        },
      },

      // Unwind user data
      {
        $unwind: "$userData",
      },

      // Project required user fields
      {
        $project: {
          _id: 1,
          userName: "$userData.userName",
          email: "$userData.email",
          photo:"$userData.photo",
          createdAt: "$userData.createdAt",
        },
      },

      // Union with current user's data
      {
        $unionWith: {
          coll: "users",
          pipeline: [
            {
              $match: {
                _id: req.user._id,
              },
            },
            {
              $project: {
                _id: 1,
                userName: 1,
                email: 1,
                photo:1,
                createdAt: 1,
              },
            },
          ],
        },
      },

      // Group again to remove potential duplicates
      {
        $group: {
          _id: "$_id",
          userName: { $first: "$userName" },
          email: { $first: "$email" },
          photo: { $first: "$photo" },
          createdAt: { $first: "$createdAt" },
        },
      },

      // Lookup group information
      {
        $lookup: {
          from: "groups",
          localField: "_id",
          foreignField: "members",
          as: "groupData",
        },
      },

      // Unwind group data (preserve users without groups)
      {
        $unwind: {
          path: "$groupData",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Modified messages lookup to prevent duplication
      {
        $lookup: {
          from: "messages",
          let: { 
            userId: "$_id",
            currentUserId: req.user._id
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [
                        {
                          $and: [
                            { $eq: ["$sender", "$$userId"] },
                            { $eq: ["$receiver", "$$currentUserId"] }
                          ]
                        },
                        {
                          $and: [
                            { $eq: ["$sender", "$$currentUserId"] },
                            { $eq: ["$receiver", "$$userId"] }
                          ]
                        }
                      ]
                    }
                  ]
                }
              }
            },
            {
              $sort: { createdAt: -1 }
            },
            {
              $group: {
                _id: null,
                // Get messages with sent/delivered status
                sentDeliveredMessages: {
                  $push: {
                    $cond: [
                      { $in: ["$status", ["sent", "delivered"]] },
                      "$$ROOT",
                      null
                    ]
                  }
                },
                // Get the last message regardless of status
                lastMessage: { $first: "$$ROOT" }
              }
            },
            {
              $project: {
                messages: {
                  $cond: [
                    { $gt: [{ $size: { $filter: { input: "$sentDeliveredMessages", as: "msg", cond: { $ne: ["$$msg", null] } } } }, 0] },
                    { $filter: { input: "$sentDeliveredMessages", as: "msg", cond: { $ne: ["$$msg", null] } } },
                    ["$lastMessage"]
                  ]
                }
              }
            }
          ],
          as: "messageData"
        }
      },

      // Unwind message data (preserve users without messages)
      {
        $unwind: {
          path: "$messageData",
          preserveNullAndEmptyArrays: true
        }
      },

      // Final projection
      {
        $project: {
          _id: 1,
          userName: 1,
          email: 1,
          photo:1,
          createdAt: 1,
          group: {
            groupId: { $ifNull: ["$groupData._id", null] },
            groupName: { $ifNull: ["$groupData.userName", null] },
            groupCreatedAt: { $ifNull: ["$groupData.createdAt", null] },
            members: { $ifNull: ["$groupData.members", null] },
            admin: { $ifNull: ["$groupData.admin", null] },
            description: { $ifNull: ["$groupData.description", null] },
            createdBy: { $ifNull: ["$groupData.createdBy", null] },
            photo: { $ifNull: ["$groupData.photo", null] },
          },
          messages: { $ifNull: ["$messageData.messages", []] }
        }
      }
    ];

    const results = await message.aggregate(pipeline);

    const userMap = new Map();

    results.forEach((user) => {
      if (!user.group.groupId) {
        // Handle non-group users
        if (!userMap.has(user._id.toString())) {
          userMap.set(user._id.toString(), {
            _id: user._id,
            userName: user.userName,
            email: user.email,
            photo: user.photo,
            createdAt: user.createdAt,
            messages: user.messages,
            groups: []
          });
        }
      } else {
        // Handle users with groups
        if (!userMap.has(user._id.toString())) {
          userMap.set(user._id.toString(), {
            _id: user._id,
            userName: user.userName,
            email: user.email,
            photo: user.photo,
            createdAt: user.createdAt,
            messages: user.messages,
            groups: [user.group]
          });
        } else {
          const existingUser = userMap.get(user._id.toString());
          existingUser.groups.push(user.group);
        }
      }
    });

    // Format the response
    // const formattedUsers = results.map((user) => ({
    //   _id: user._id,
    //   userName: user.userName,
    //   email: user.email,
    //   createdAt: user.createdAt,
    //   group: user.group.groupId ? user.group : null,
    //   messages: user.messages
    // }));

    // Extract unique groups with additional details
    const uniqueGroups = Array.from(
      new Set(
        results
          .filter((user) => user.group.groupId)
          .map((user) =>
            JSON.stringify({
              _id: user.group.groupId,
              userName: user.group.groupName,
              createdAt: user.group.groupCreatedAt,
              members: user.group.members,
              admin: user.group.admin,
              description: user.group.description,
              createdBy: user.group.createdBy,
              photo: user.group.photo,
            })
          )
      )
    ).map((group) => JSON.parse(group));

    return res.status(200).json({
      status: 200,results,
      message: "All Message Users and Groups Found Successfully...",
      users: [...Array.from(userMap.values()), ...uniqueGroups],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};


exports.updateUser = async (req, res) => {
  try {
    // Include the photo field in the update
    if(req.file){
      req.body.photo = req.file.path
    }
    const updatedUser = await user.findByIdAndUpdate(
      req.params.id,
      { ...req.body, photo: req.body.photo ? req.body.photo : undefined }, // Ensure photo is included if provided
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "User updated successfully",
      users: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.getSingleUser = async (req, res) => {
  try {
    const users = await user.findById(req.params.id);
    if (!users) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    } else {
      return res.status(200).json({
        status: 200,
        message: "User found successfully",
        users,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};


exports.getAllCallUsers = async (req, res) => {
  try {
    const pipeline = [
      // Match messages where user is either sender or receiver and content type is "call"
      {
        $match: {
          $and: [
            {
              $or: [{ sender: req.user._id }, { receiver: req.user._id }],
            },
            {
              "content.type": "call" // Filter for call messages
            }
          ],
        },
      },

      // Project to get the other user in the conversation
      {
        $project: {
          user: {
            $cond: {
              if: { $eq: ["$sender", req.user._id] },
              then: "$receiver",
              else: "$sender",
            },
          },
          message: "$$ROOT" // Include the entire message document
        },
      },

      // Group by user to remove duplicates
      {
        $group: {
          _id: "$user",
          messages: { $push: "$message" } // Collect messages for each user
        },
      },

      // Lookup user details
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userData",
        },
      },

      // Unwind user data
      {
        $unwind: "$userData",
      },

      // Group again to ensure uniqueness and project required user fields
      {
        $group: {
          _id: "$userData._id",
          userName: { $first: "$userData.userName" },
          email: { $first: "$userData.email" },
          photo: { $first: "$userData.photo" },
          createdAt: { $first: "$userData.createdAt" },
          messages: { $first: "$messages" } // Include messages in the final output
        },
      },

      // Final projection
      {
        $project: {
          _id: 1,
          userName: 1,
          email: 1,
          photo: 1,
          createdAt: 1,
          messages: 1 // Include messages in the response
        },
      },
    ];

    const results = await message.aggregate(pipeline);

    return res.status(200).json({
      status: 200,
      message: "All Unique Call Users and Messages Found Successfully...",
      users: results,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};