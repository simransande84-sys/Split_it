const express = require("express");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();
const GroupModel = require("../models/Group");
const SignUpModel = require("../models/Users");
require("dotenv").config();
const CLIENT_URL = process.env.CLIENT_URL;

router.post("/create-group", async (req, res) => {
  try {
    const { name, createdBy } = req.body;
    console.log("--> POST /create-group called with body:", req.body);

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Group name is required" });
    }

    const inviteToken = uuidv4();

    const group = new GroupModel({
      name: name.trim(),
      createdBy,
      inviteToken,
      members: [],
    });

    await group.save();
    console.log("--> Saved group to MongoDB. ID:", group._id, "inviteToken:", group.inviteToken);

    const clientUrl = CLIENT_URL || "http://localhost:5173";
    const inviteLink = `${clientUrl}/join-group?name=${encodeURIComponent(
      group.name
    )}&createdBy=${createdBy}&token=${group.inviteToken}`;

    console.log("--> Generated inviteLink:", inviteLink);
    res.status(200).json({ inviteLink, inviteToken: group.inviteToken, group });
  } catch (err) {
    console.error("Error generating invite link:", err.message, err.stack);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/create", async (req, res) => {
  try {
    const { name, memberEmails = [], createdBy, inviteToken } = req.body;
    console.log("--> POST /create called with body:", req.body);

    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "Group name is required" });
    }

    let group = null;
    const cleanToken = inviteToken ? inviteToken.trim() : "";
    if (cleanToken !== "") {
      group = await GroupModel.findOne({ inviteToken: cleanToken });
    }

    const membersToAdd = memberEmails
      .filter((email) => email.trim() !== "")
      .map((email) => ({
        email,
        invitedAt: new Date(),
        hasJoined: false,
      }));

    if (group) {
      group.name = name.trim();
      membersToAdd.forEach((newMem) => {
        const exists = group.members.some((m) => m.email === newMem.email);
        if (!exists) {
          group.members.push(newMem);
        }
      });
      await group.save();
      console.log("--> Updated existing group:", group._id);
    } else {
      const finalToken = cleanToken !== "" ? cleanToken : uuidv4();

      group = new GroupModel({
        name: name.trim(),
        createdBy,
        members: membersToAdd,
        inviteToken: finalToken,
      });
      await group.save();
      console.log("--> Created new group:", group._id, "with token:", group.inviteToken);
    }

    res.status(201).json({ success: true, group });
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/details/:token", async (req, res) => {
  const token = req.params.token ? req.params.token.trim() : "";
  console.log("--> GET /details/:token received token:", token);

  try {
    const group = await GroupModel.findOne({ inviteToken: token }).populate({
      path: "createdBy",
      select: "username",
    });

    console.log("--> Group query result:", group ? { id: group._id, name: group.name, createdBy: group.createdBy } : null);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const creatorName = group.createdBy && group.createdBy.username
      ? group.createdBy.username
      : "Group Owner";

    res.json({
      name: group.name,
      createdBy: creatorName,
    });
  } catch (err) {
    console.error("Error fetching group details:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/join-group", async (req, res) => {
  const { token, email, accept } = req.query;
  const cleanToken = token ? token.trim() : "";

  console.log("Join Group Request:", { token: cleanToken, email, accept });

  try {
    const group = await GroupModel.findOne({ inviteToken: cleanToken });

    if (!group) {
      return res.status(404).json({ message: "Invalid invite link" });
    }

    if (accept === "yes") {
      if (!email) {
        return res.status(400).json({ message: "Email required to join" });
      }

      const existingMember = group.members.find(
        (member) => member.email === email
      );

      if (!existingMember) {
        group.members.push({
          email,
          hasJoined: true,
          joinedAt: new Date(),
          invitedAt: new Date(),
        });
      } else {
        existingMember.hasJoined = true;
        existingMember.joinedAt = new Date();
      }

      await group.save();
      return res.json({ message: "You have been added to the group" });
    } else {
      return res.json({ message: "You declined the invite" });
    }
  } catch (err) {
    console.error("Error joining group:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/get-groups", async (req, res) => {
  const { createdBy } = req.query;

  try {
    const groups = await GroupModel.find({ createdBy }).populate(
      "createdBy",
      "username"
    ); 

    res.status(200).json({ success: true, groups });
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ success: false, message: "Failed to fetch groups" });
  }
});

module.exports = router;
