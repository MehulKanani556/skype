const Group = require("../models/groupModel"); // Assuming you have a Group model
const User = require("../models/userModels");
const { saveMessage } = require("./messageController");

async function createGroup(req, res) {
  try {
    const { userName, members, createdBy } = req.body;
    if(req.file){
        req.body.photo = req.file.path
    }
    const group = await Group.create({ userName, members, createdBy, photo: req.body.photo ? req.body.photo : undefined });
    if(!group){
        return res.status(400).json({ error: "Failed to create group", code: 400 });
    }
    return res.status(200).json({ groupId: group._id, group });
  } catch (error) {
    console.error("Error creating group:", error);
    return res
      .status(500)
      .json({ error: "Error creating group", code: error.code || 500 });
  }
}

async function updateGroup(req, res) {
  try {
    const { groupId } = req.body; // Only keep groupId from the body
    const updateData = {}; // Create an object to hold the fields to update

    if (req.body.userName) {
      updateData.userName = req.body.userName; // Add userName if it exists
    }
    if (req.body.members) {
      updateData.members = req.body.members; // Add members if it exists
    }
    if (req.file) {
      updateData.photo = req.file.path; // Update photo if a file is uploaded
    }

    await Group.findByIdAndUpdate(groupId, updateData); // Update only the fields that are present
    return res.status(200).json({ message: "Group updated successfully" });
  } catch (error) {
    console.error("Error updating group:", error);
    return res
      .status(500)
      .json({ error: "Error updating group", code: error.code || 500 });
  }
}

async function addParticipants(req, res) {
  try {
    const { groupId, members, addedBy } = req.body; 
    const group = await Group.findByIdAndUpdate(groupId, { $push: { members } });
    
    console.log(members);
  
    for (const memberId of members) {
      const addedByUser = await User.findById(addedBy);
      const memberName = await User.findById(memberId); // Function to get user name by ID

      await saveMessage({
        senderId: addedBy,
        receiverId: groupId,
        content: {
          type: "system",
          content: `**${addedByUser.userName}** added **${memberName.userName}** to this conversation`,
        },
      });
     }

    return res.status(200).json({ group }); 
  } catch (error) {
    console.error("Error adding participants:", error);
    return res
      .status(500)
      .json({ error: "Error adding participants", code: error.code || 500 });
  }
}

async function deleteGroup(req, res) {
  try {
    const { groupId } = req.params; // Assuming groupId is passed as a URL parameter
    await Group.findByIdAndDelete(groupId);
    return res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    return res
      .status(500)
      .json({ error: "Error deleting group", code: error.code || 500 });
  }
}

async function getGroupById(req, res) {
  try {
    const { groupId } = req.params; // Assuming groupId is passed as a URL parameter
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found", code: 404 });
    }
    return res.status(200).json(group);
  } catch (error) {
    console.error("Error retrieving group by ID:", error);
    return res
      .status(500)
      .json({ error: "Error retrieving group", code: error.code || 500 });
  }
}

async function findGroupById(groupId) {
    try {
      const group = await Group.findById(groupId);
      return group; // Return the group or null if not found
    } catch (error) {
      console.error("Error retrieving group by ID:", error);
      return null; // Return null on error
    }
  }

async function getAllGroups(req, res) {
  try {
    const groups = await Group.find();
    return res.status(200).json(groups);
  } catch (error) {
    console.error("Error retrieving all groups:", error);
    return res
      .status(500)
      .json({ error: "Error retrieving groups", code: error.code || 500 });
  }
}

  async function leaveGroup(req, res) {
    try {
      const { userId, groupId, removeId } = req.body;
      const group = await Group.findByIdAndUpdate(
        groupId,
        { $pull: { members: userId } }, // Remove the user from the group's members
        { new: true, runValidators: true } // Return the updated group and run validators
      );
      if (!group) {
        return res.status(404).json({ error: "Group not found", code: 404 });
      }
      const user = await User.findById(userId);
     
      // Save a message indicating the user has left the group

      if(removeId){

      const removeUser = await User.findById(removeId);
      await saveMessage({
        senderId: userId,
        receiverId: groupId,
        content: {
          type: "system",
          content: `**${removeUser.userName}** has removed **${user.userName}** from this conversation`,
        },
      });
      }else{
        await saveMessage({
          senderId: userId,
          receiverId: groupId,
          content: {
            type: "system",
            content: `**${user.userName}** has left the group.`,
          },
        });
      }
      return res.status(200).json({ message: "User left the group successfully", group });
    } catch (error) {
      console.error("Error leaving group:", error);
      return res
        .status(500)
        .json({ error: "Error leaving group", code: error.code || 500 });
    }
  }

module.exports = {
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupById,
  getAllGroups,
  findGroupById,
  leaveGroup,
  addParticipants,
};
