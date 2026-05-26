import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
    {
        Username:{
            type : String,
            required : [true, 'Username is required'],
            unique : true,
            lowercase : true
        },
        eMail:{
            type : String,
            required : [true, 'eMail is required'],
            unique : true,
            lowercase : true
        },
        password: {
            type: String,
            required : [true, 'password is required'],
            unique : true,
            minLength : [8, "password is too short"],
            select: false,
        },
        email_Varified: {
            type:Boolean,
            default: false
        },
        isActive: {
            type :Boolean,
            default: false,
        },
        lastLogin :{
            type: Date,
            default : null
        },
        loginAttemptes : {
            type : Number,
            default : null
        },
        loginLockedUntil : {
            type : Date,
            default : null,
        }
    },
      {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


userSchema.index({eMail : 1},{unique: true});
userSchema.index({Username : 1}, {unique : true});
userSchema.index({isActive : 1});

// methords:- reset login attemts, incress login attemts
//  vertual :- isLocked

mongoose.virtuals("isLocked").get(function () {
    if(!this.loginLockedUntil)return false;
    return this.loginLockedUntil >new Date();
});

mongoose.method.resetLoginAttempts = function (){
    this.loginAttemptes = 0;
    this.loginLockedUntil = null;
    this.lastLogin = new Date();
    return this.save();
}

mongoose.method.incressLoginAttempts = function (){
    this.loginAttemptes += 1;
   if(this.loginAttemptes >= 4){
    this.loginLockedUntil = new Date(Date.now() + 30*60*1000)
   }

   return this.save();
}

const User = mongoose.Model("User", userSchema);
export default User;