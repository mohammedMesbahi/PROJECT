const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema;
const mongodbErrorHandler = require("mongoose-mongodb-errors");
const passportLocalMongoose = require('passport-local-mongoose');
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true,"enter a valid user name"]
    },
    email: {
        type: String,
        unique: true,
        required: [true,"enter a valid email"]
    },
    following: [{ type: ObjectId, ref: "User" }],
    followers: [{ type: ObjectId, ref: "User" }]
})
const options ={
    saltlen:10,
    hashlen:10,
    usernameField:"email",
    keylen:56,
    // unlockInterval:5000
    maxAttempts:3,
    selectFields:['name','email','following']
}
userSchema.plugin(passportLocalMongoose, options);
userSchema.plugin(mongodbErrorHandler);
module.exports = mongoose.model("User", userSchema);