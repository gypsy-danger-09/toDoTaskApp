const cookieParser = require('cookie-parser')
const express = require('express')
const app = express()
const path = require('path')
const userModel = require('./models/user')
const postModel = require('./models/post')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const upload = require('./utils/multer')

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.set("view engine","ejs")
app.use(express.static(path.join(__dirname,'public')))
app.use(cookieParser())

    app.get('/',(req,res) => {
        res.render('index')
    })

    app.get('/register',(req,res) => {
        res.render('register')
    })

    app.get('/profile/upload',(req,res)=>{
        res.render('profileupload')
    })

    app.post('/upload',isLoggedIn, upload.single("image") ,async(req,res) => {
        let user = await userModel.findOne({email:req.user.email})
        user.profilePic = req.file.filename
        await user.save()
        res.redirect('/profile')
    })

    app.post('/register',async(req,res) => {
        let {name,username,email,password,age} = req.body

        let user = await userModel.findOne({email})

        if(user){
            return res.send('User already registered').status(500)
        }

        bcrypt.genSalt(10, (err,Salt) => {
        bcrypt.hash(password,Salt, async (err,hash) => {
        let user = await userModel.create({
            username,email,password:hash,age
        })

        let token = jwt.sign({email: email,userid: user._id},'secret-key')
        
        res.cookie("token",token)
        res.send("Registered")
            })
        })
        })

    app.get('/login',(req,res) => {
        res.render('login')
    })

    
    app.post('/login',async (req,res) => {
        let user = await userModel.findOne({email:req.body.email})
        if(!user){
            res.send('Something went wrong')
        }

        bcrypt.compare(req.body.password,user.password,(err,result)=>{
            if (result){
                let token = jwt.sign({email:user.email},'secret-key')
                res.cookie("token",token)
                res.status(200).redirect('/profile')
            }
            else
            res.send('Something is wrong').redirect('/login')
        })
    })

    app.get('/profile', isLoggedIn, async (req,res) => {
        let user = await userModel.findOne({email : req.user.email}).populate('post')
        res.render('profile',{user})
    })

    app.post('/post', isLoggedIn, async (req,res) => {
        let user = await userModel.findOne({email : req.user.email})
        let post = await postModel.create({
            user: user._id,
            content : req.body.content
        })

        user.post.push(post._id)
        user.save()
        res.redirect('/profile')
    })

    app.get('/logout',(req,res) => {
        res.cookie('token','')
        res.redirect('/')
    })
    
    app.get('/delete/:id',isLoggedIn,async(req,res)=>{
        await postModel.findOneAndDelete({_id:req.params.id})
        res.redirect('/profile')    
    })

    app.get('/edit/:id',isLoggedIn,async(req,res) => {
        let post = await postModel.findOne({_id:req.params.id}).populate('user')
        res.render('edit',{post})
    })

    
    app.post('/update/:id',isLoggedIn,async(req,res) => {
        let post = await postModel.findOneAndUpdate({_id:req.params.id},{content: req.body.content})
        res.redirect('/profile')
    })

    function isLoggedIn(req,res,next) {
        if (req.cookies.token == "")
           {
            res.redirect('/login')}

        else{
            let data = jwt.verify(req.cookies.token,'secret-key')
            req.user = data
        }

        next()
    }

app.listen(8081,() => {
    console.log('App is running on port 8081',)
})