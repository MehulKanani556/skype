const Group = require("../models/groupModel"); // Assuming you have a Group model

async function createGroup(req, res) {
  try {
    const { userName, members, createdBy } = req.body; // Assuming you're using body-parser middleware
    const group = new Group({ userName, members, createdBy });
    await group.save();
    return res.status(200).json({ groupId: group._id });
  } catch (error) {
    console.error("Error creating group:", error);
    return res
      .status(500)
      .json({ error: "Error creating group", code: error.code || 500 });
  }
}

async function updateGroup(req, res) {
  try {
    const { groupId, userName, members } = req.body; // Assuming you're using body-parser middleware
    await Group.findByIdAndUpdate(groupId, { userName, members });
    return res.status(200).json({ message: "Group updated successfully" });
  } catch (error) {
    console.error("Error updating group:", error);
    return res
      .status(500)
      .json({ error: "Error updating group", code: error.code || 500 });
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
      const { userId, groupId } = req.body;
      const group = await Group.findByIdAndUpdate(
        groupId,
        { $pull: { members: userId } }, // Remove the user from the group's members
        { new: true, runValidators: true } // Return the updated group and run validators
      );
      if (!group) {
        return res.status(404).json({ error: "Group not found", code: 404 });
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
};
