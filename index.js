require('dotenv').config()

const express = require('express')
const app = express()
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.MONGODB_URI;


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
  app.post("/api/users/:_id/exercises", async (req, res) => {
    try {
      const userdata = await db.collection("users").findOne({ _id: new ObjectId(req.params._id) }); // Corrected the query

      if (!userdata) {
        return res.status(404).json({ error: "User not found" });
      }
      const date = new Date(req.body.date)
      const exercise = {
        _id: req.params._id, // Assuming you want to use the user's _id
        username: userdata.username, // Corrected to use userdata.username
        date: date.toDateString(),
        duration: req.body.duration,
        description: req.body.description,
      };

      const result = await db.collection("workouts").insertOne(exercise);

      console.log("Document inserted " + result);
      res.json(exercise);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/:_id/logs", async (req, res) => {
    const { from, to, limit } = req.query;
    const id = req.params._id;
    const user = await db.collection("users").findOne({ _id: new ObjectId(id) });
  
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
  
    const query = { _id: new ObjectId(id) };
  
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }
  
    const cursor = db.collection("workouts").find(query).sort({ date: 1 }).limit(parseInt(limit) || 0);
    const exercises = await cursor.toArray();
  
    // Prepare the response
    const log = exercises.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString(),
    }));
  
    res.json({
      _id: id,
      username: user.username,
      count: log.length,
      log: log,
    });
  });
  
  const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
  });
}).catch((error) => {
  console.error("Error connecting to MongoDB:", error);
});
