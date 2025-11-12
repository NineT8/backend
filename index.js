const express = require('express');
const cors = require('cors');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const {middleware} = require('./middleware')
require('dotenv').config()
app.use(express.json())

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));


// app.use(cors());


app.post('/login', async (req,res)=>{
    const {email, password} = req.body;
    try{
        const user = await prisma.users.findUnique({
            where:{
                email: email,
            }
        })
        const valid = await bcrypt.compare(password, user.password);
        if(valid){
            const token = jwt.sign({name: user.name, email: user.email}, process.env.JWT_SECRET, {expiresIn: '2m'});
            return res.status(201).json({'message': 'User created', token: token})
        }
        return res.status(400).json({'error': 'token Expire'})
        
    }catch(err){
        return res.status(400).json({'error':'User not Found'})
    }
    
})

app.post('/signup', async(req,res)=>{
    const {name, email, password} = req.body;
    try{
        const hashedpass = await bcrypt.hash(password, 10)
        const user = await prisma.users.create({
            data:{
                name: name,
                email: email,
                password: hashedpass
            }
        })
        const token = jwt.sign({name: user.name, email: user.email}, process.env.JWT_SECRET, {expiresIn: '2m'});
        return res.status(201).json({'message': 'User created', token: token})
        
    }catch(err){
        return res.status(400).json({'error': 'User already exists. Try logging in.'})
    }
})

app.get('/users',middleware, async(req,res)=>{
    try{
        const data = await prisma.users.findMany();
        console.log(data)
        return res.status(201).json({data: data})
    }catch(err){
        console.log(err)
        return res.status(500).json({'error': 'Internal Server Error.'})
    }
})


app.listen(process.env.PORT || 3000, ()=>{
    console.log("server started....")
})
