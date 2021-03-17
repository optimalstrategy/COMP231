import { Schema } from "mongoose";
const UserSchema = new Schema({
    email :{
        type  : String,
        required : true
    } ,
    password :{
        type  : String,
        required : true
    } ,
    date :{
        type : Date,
        default : Date.now
    }
});

export default UserSchema;
