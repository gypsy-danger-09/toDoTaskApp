const mongoose = require('mongoose')

mongoose.connect(`mongodb://127.0.0.1:27017/mongopractice`)
.then(() =>{
    console.log('DB Connected')
})
.catch((err) => {
    console.log(err)
})

const userSchema = mongoose.Schema({
    username : String,
    name:String,
    email: String,
    password: String,
    age: Number,
    post:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:'post'
        }
    ],
    profilePic: {
        type:String,
        default:"default.jpg"
    }
})

module.exports = mongoose.model('user',userSchema)