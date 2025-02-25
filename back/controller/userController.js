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
        $unwind: {
          path: "$userData",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Project required user fields
      {
        $project: {
          _id: 1,
          userName: { $ifNull: ["$userData.userName", null] },
          email: { $ifNull: ["$userData.email", null] },
          photo: { $ifNull: ["$userData.photo", null] },
          createdAt: { $ifNull: ["$userData.createdAt", null] },
          phone: { $ifNull: ["$userData.phone", null] },
          dob: { $ifNull: ["$userData.dob", null] },
          isUser: { $cond: [{ $ifNull: ["$userData._id", null] }, true, false] },
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
                photo: 1,
                createdAt: 1,
                phone: 1,
                dob: 1,
                isUser: { $literal: true },
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
          phone: { $first: "$phone" },
          dob: { $first: "$dob" },
          isUser: { $first: "$isUser" },
        },
      },

      // Lookup group information
      {
        $lookup: {
          from: "groups",
          pipeline: [
            {
              $match: {
                members: req.user._id
              }
            },
            {
              $project: {
                _id: 1,
                userName: 1,
                members: 1,
                admin: 1,
                description: 1,
                createdBy: 1,
                createdAt: 1,
                photo: 1,
              }
            }
          ],
          as: "groups"
        }
      },

      // Modified messages lookup for direct messages
      {
        $lookup: {
          from: "messages",
          let: {
            userId: "$_id",
            currentUserId: req.user._id,
            isUser: "$isUser"
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$$isUser", true] },  // Only match direct messages when the ID belongs to a user
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
              $limit: 20
            }
          ],
          as: "directMessages"
        }
      },

      // Final projection for users
      {
        $project: {
          _id: 1,
          userName: 1,
          email: 1,
          photo: 1,
          createdAt: 1,
          phone: 1,
          dob: 1,
          isUser: 1,
          directMessages: 1,
          groups: 1
        }
      }
    ];

    const results = await message.aggregate(pipeline);

    // Process the results to include group messages
    const userResults = results.filter(item => item.isUser);

    // Extract unique groups from the results using a Map
    const uniqueGroupsMap = new Map();

    results.forEach(result => {
      if (result.groups && result.groups.length > 0) {
        result.groups.forEach(group => {
          // Use group ID as key to ensure uniqueness
          uniqueGroupsMap.set(group._id.toString(), group);
        });
      }
    });

    // Convert Map values to array to get unique groups
    const uniqueGroups = Array.from(uniqueGroupsMap.values());

    // Now fetch messages for each group
    const groupsWithMessages = [];
    for (const group of uniqueGroups) {
      const groupMessages = await message.find({
        receiver: group._id,
        deletedFor: { $ne: req.user._id }
      })
        .sort({ createdAt: -1 })
        .limit(20);

      groupsWithMessages.push({
        _id: group._id,
        userName: group.userName,
        photo: group.photo,
        createdAt: group.createdAt,
        members: group.members,
        admin: group.admin,
        description: group.description,
        createdBy: group.createdBy,
        isGroup: true,
        messages: groupMessages
      });
    }

    // Format the user results
    const formattedUsers = userResults.map(user => ({
      _id: user._id,
      userName: user.userName,
      email: user.email,
      photo: user.photo,
      createdAt: user.createdAt,
      phone: user.phone,
      dob: user.dob,
      isUser: true,
      messages: user.directMessages || []
    }));

    return res.status(200).json({
      status: 200,
      message: "All Message Users and Groups Found Successfully...",
      users: [...formattedUsers, ...groupsWithMessages],
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
    if (req.file) {
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

      // Group by user to remove duplicates and get the last message
      {
        $group: {
          _id: "$user",
          lastMessage: { $last: "$message" } // Get the last message for each user
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
          messages: { $addToSet: "$lastMessage" } // Include messages in the final output as an array
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
          messages: 1 // Include messages in the response as an array
        },
      },
    ];

    const results = await message.aggregate(pipeline);

    return res.status(200).json({
      status: 200,
      message: "All Unique Call Users and Last Messages Found Successfully...",
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