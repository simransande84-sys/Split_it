const mongoose = require("mongoose");

const splitSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "groups",
    required: false,
  },
  contacts: [
    {
      type: String,
      required: false,
    },
  ],
  dueDate: {
    type: Date,
    default: null,
    required: false,
  },
  currency: {
    type: String,
    default: "INR",
    required: false,
  },
  amount: {
    type: Number,
    required: true,
  },
  splitOption: {
    type: String,
    enum: ["equally", "individual"],
    required: true,
  },
  splitDetails: [
    // Change from 'Map' to an Array of Objects
    {
      email: {
        type: String,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      isPaid: {
        type: Boolean,
        default: false,
      },
      paidAt: {
        type: Date,
      },
    },
  ],
  description: {
    type: String,
    default: "",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "sign_up_forms",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
    required: true,
  },
  settledManually: {
    type: Boolean,
    default: false
  },
  settledAt: { type: Date },
  unsettledAt: {
    type: Date,
    default: null,
  },
  paymentLog: [
    {
      action: {
        type: String,
        enum: ['member_paid', 'member_unpaid', 'split_settled_manual', 'split_settled_auto', 'split_unsettled'],
        required: true
      },
      memberEmail: {
        type: String,
        required: function () { return this.action === 'member_paid' || this.action === 'member_unpaid'; }
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      amount: {
        type: Number
      },
    }
  ]

});

// Custom validation: Group must be provided
splitSchema.pre("validate", function (next) {
  if (!this.group) {
    return next(
      new Error("A group must be selected for the split.")
    );
  }
  next();
});

const SplitModel = mongoose.model("Split", splitSchema);
module.exports = SplitModel;
