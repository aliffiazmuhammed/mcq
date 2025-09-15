const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ROLES } = require("../constants/roles");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, "Name is required"] },
        email: { type: String, required: [true, "Email is required"], unique: true },
        password: { type: String, required: [true, "Password is required"] },
        role: { type: String, enum: Object.values(ROLES), default: ROLES.MAKER },
    },
    { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
