import "dotenv/config";
import express from "express";
import {
  Collection,
  Document,
  MongoClient,
  ObjectId,
  Timestamp,
} from "mongodb";
import multer from "multer";

const app = express();
const mongoConnectionString = `mongodb+srv://kkawathia841994:${process.env.MONGO_PASS}@nodejs-challenge.mtslz.mongodb.net/?retryWrites=true&w=majority&appName=Nodejs-Challenge`;
const client = new MongoClient(mongoConnectionString);
let collection: Collection<Document>;
client.connect().then(() => {
  collection = client.db("Deepthought_Database").collection("Events");
});

const apiUrl = `/api/v3/app`;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get(`${apiUrl}/events`, async (req, res) => {
  const type = req.query.type?.toString();
  if (type === "latest") {
    const limit = parseInt(req.query.limit?.toString() || "10");
    const page = parseInt(req.query.page?.toString() || "1");
    const events = await collection.find().sort({ updatedAt: -1 }).toArray();
    const pagedEvents = events.slice((page - 1) * limit, page * limit);
    console.log(
      pagedEvents.map((event) => {
        return { name: event.name, updatedAt: event.updatedAt };
      })
    );
    res.send(
      pagedEvents.map((event) => {
        return { name: event.name, updatedAt: event.updatedAt };
      })
    );
    return;
  }
  const eventId = req.query.id?.toString();
  if (!eventId) res.status(400).send("Invalid Event Id");

  const event = await collection.findOne({
    _id: new ObjectId(eventId),
  });
  if (!event) {
    res.status(404).send("Event not found");
    return;
  }
  console.log(event);
  res.send(event);
});

app.post(`${apiUrl}/events`, upload.single("image"), async (req, res) => {
  const image = req.file;
  const body = req.body;
  console.log(body);
  if (
    !image?.buffer ||
    !body.name ||
    !body.tagline ||
    !body.description ||
    !body.schedule ||
    !body.moderator ||
    !body.category ||
    !body.subCategory ||
    !body.rigorRank
  ) {
    res.status(400).send("Invalid Request");
    return;
  }
  const result = await collection.insertOne({
    name: body.name,
    tagline: body.tagline,
    description: body.description,
    schedule: body.schedule,
    moderator: body.moderator,
    category: body.category,
    "sub-category": body.subCategory,
    "rigor-rank": body.rigorRank,
    file: image?.buffer,
    updatedAt: Timestamp.fromNumber(new Date().getTime()),
  });
  res.send(result.insertedId);
});

app.put(`${apiUrl}/events/:id`, upload.single("image"), async (req, res) => {
  const eventId = req.params.id;
  const image = req.file;
  const body = req.body;
  console.log(eventId);

  const updatedFields = {
    updatedAt: Timestamp.fromNumber(new Date().getTime()),
  };
  if (body.name) updatedFields["name"] = body.name;
  if (body.tagline) updatedFields["tagline"] = body.tagline;
  if (body.description) updatedFields["description"] = body.description;
  if (body.schedule) updatedFields["schedule"] = body.schedule;
  if (body.moderator) updatedFields["moderator"] = body.moderator;
  if (body.category) updatedFields["category"] = body.category;
  if (body.subCategory) updatedFields["sub-category"] = body.subCategory;
  if (body.rigorRank) updatedFields["rigor-rank"] = body.rigorRank;
  if (image?.buffer) updatedFields["file"] = image?.buffer;

  collection
    .updateOne(
      { _id: new ObjectId(eventId) },
      {
        $set: updatedFields,
      }
    )
    .catch((err) => {
      res.status(400).send("Invalid Request");
      console.log(err);
    });
  res.send(`Updated Event with id ${eventId}`);
});

app.delete(`${apiUrl}/events/:id`, async (req, res) => {
  const eventId = req.params.id;
  console.log(eventId);
  collection.deleteOne({ _id: new ObjectId(eventId) }).catch((err) => {
    res.status(400).send("Invalid Request");
    console.log(err);
  });
  res.send(`Deleted Event with id ${eventId}`);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
