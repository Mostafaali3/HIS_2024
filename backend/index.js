require('dotenv').config();
const { Pool } = require('pg');
const express = require('express')
const httpStatusCodes = require('./utils/httpStatusCodes')


const app = express()
app.use(express.json())

const session =require('express-session');

const secretKey=require('./utils/secretKey')

app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized:true
}));





let { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;
const pool = new Pool({
  host: PGHOST,
  database: PGDATABASE,
  username: PGUSER,
  password: PGPASSWORD,
  port: 5432,
  ssl: {
    require: true,
  },
});


// login 
app.post('/api/login',async (req, res) =>{
        const {email , password}  = req.body

        const client = await pool.connect();
        try {
          if (!(email && password)){
          res.status(400).json({status:httpStatusCodes.FAIL , msg:"You have to insert your email and password"})
          return
          }
          const result = await client.query(`select u.email, u.password from users u where u.email = '${email}'`);
          if (!result.rows.length){
            res.status(400).json({status:httpStatusCodes.FAIL , msg:"User Not Found"})
            return
          }
          const db_password = result.rows[0].password
          if (password === db_password){
              req.session.email=email;
              res.status(200).json({status:httpStatusCodes.SUCCESS , msg:"You have logged in successfully"})
            }
            else {res.status(500).json({status:httpStatusCodes.FAIL , msg:"Wrong Password"})}
            return
          }
        catch(error){
          console.log(error);
        }
        finally {
          client.release();
        }
      }
)


// register 

app.post('/api/register',async (req, res) =>{
  const {email , first_name, last_name, password, phone_number}  = req.body
  console.log(email , first_name, last_name, password, phone_number)

  const client = await pool.connect();

  try {
  if (!(email && password && first_name && last_name && phone_number)){
    res.status(400).json({status:httpStatusCodes.FAIL , msg:"You have to insert all required fields"})
    return
    }
  const existingUser = await client.query(`select u.email from users u where u.email = '${email}'`);
  const existingNumber = await client.query(`select u.phone_number from users u where u.phone_number = '${phone_number}'`);
  if(existingUser.rows.length){
    res.json({status: httpStatusCodes.FAIL, msg:"email already exists"})
    return 
  }
  if(existingNumber.rows.length){
    res.json({status: httpStatusCodes.FAIL, msg:"phone number already exists"})
    return 
  }

  await client.query(`insert into users(email, password, first_name, last_name, phone_number) values('${email}', '${password}' ,'${first_name}', '${last_name}','${phone_number}')`);
  res.status(200).json({staus:httpStatusCodes.SUCCESS, msg:"user registered succssesfully"})
  }catch(error){
    console.log(error)
  }finally {
    client.release();
  }
})


// edit user data 
app.patch('/api/editUser',async(req,res)=>{
  const {email,password}=req.body

})

// get user data 

app.get('/api/getData',async(req,res)=>{
      const client =await pool.connect();
      
  try {
    const email = req.session.email
    const existingUserData = await client.query(`select * from users u where u.email = '${email}'`);

    console.table(existingUserData.rows);
    if (existingUserData.rows.length){
      res.status(200).json({status:httpStatusCodes.SUCCESS , data:existingUserData.rows})
    }
    else {
      res.status(404).json({status:httpStatusCodes.FAIL , msg:"Error in querying the database"})
    }
  }catch(error){
      console.log(error)
    }finally {
      client.release();
    }

})

app.get('/api/logout' , (req, res)=>{
  req.session.destroy(
    (err)=>{
      if (err){
        res.status(500).json({status:httpStatusCodes.ERROR , msg:{err}})
        return
      }
      res.status(200).json({status:httpStatusCodes.SUCCESS , msg:"Logged out Successfully"})
    }
  )
})



// app.get('/',async (req, res) =>{

// })


// async function getPgVersion() {
//     const client = await pool.connect();
//     try {
//       const result = await client.query("select * from users");
//       console.table(result.rows);
//     } finally {
//       client.release();
//     }
//   }
// getPgVersion();


app.listen(4000, ()=>{
  console.log("server is running on port 4000")
})