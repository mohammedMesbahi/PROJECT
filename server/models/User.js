const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;
const bcrypt = require("bcrypt");
const mongodbErrorHandler = require("mongoose-mongodb-errors");
// const passportLocalMongoose = require('passport-local-mongoose');
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "enter a valid user name"]
    },
    email: {
        type: String,
        unique: true,
        required: [true, "enter a valid email"]
    },
    password : {
        type:String,
        required:[true,"password is required"],
        trim: true,
        min:5,
        max:100
    },
    following: [{ type: ObjectId, ref: "User" }],
    followers: [{ type: ObjectId, ref: "User" }]
})

userSchema.pre('save', function (next) {
    const saltRounds = 10;
    this.password = bcrypt.hashSync(this.password, saltRounds);
    next();
});
userSchema.methods.isValidPassword = function (password) {
    const user = this;
    const compare = bcrypt.compareSync(password, user.password);
    return compare;
}
// userSchema.plugin(passportLocalMongoose, options);
userSchema.plugin(mongodbErrorHandler);
module.exports = mongoose.model("User", userSchema);