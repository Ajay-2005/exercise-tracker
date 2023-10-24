require('dotenv').config()

const express = require('express')
const app = express()
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGODB_URI;
console.log(uri)

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Add this line to parse JSON data

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToMongoDB().then(() => {
  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
  });
  const db = client.db('excercise');
  app.post("/api/users", async (req, res) => {
    const uname = req.body.username;
    const user = {
      username: uname
    };
  
    try {
      const result = await db.collection("users").insertOne(user);
      console.log("Document inserted", result);
      res.json(user);
    } catch (error) {
      console.error("Error inserting document", error);
      res.status(500).json({ error: "Error inserting document" });
    }
  });
  app.get("/api/users", async (req, res) => {
    try {
      const users = await db.collection("users").find().toArray();
  
      res.json(users);
    } catch (error) {
      console.error("Error retrieving users", error);
      res.status(500).json({ error: "Error retrieving users" });
    }
  });
  app.post("/api/users/:_id/exercises",async(req,res)=>{
    const exercise={
      _id:req.body._id,
      description:req.body.description,
      duration:req.body.duration,
      date:req.body.date
    }
    try{
      const result=await db.collection("workouts").insertOne(exercise);
      console.log("document inserted "+result)
      res.json(exercise);
    }
    catch(error){
      console.error(error)
    }
  })
  app.get("/api/users/_id/logs",async(req,res)=>{
    try{
    const logs=await db.collection("workouts").find({_id:req.query._id}).toArray();
    console.log(logs)
    }
    catch(error){
      console.error(error)
    }
    
  })
  const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
  });
}).catch((error) => {
  console.error("Error connecting to MongoDB:", error);
});
