const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();
const app = express();
const jwt = require("jsonwebtoken");

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
	res.send("Lukas server is running");
});

// varify jwt
function verifyToken(req, res, next) {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(401).send({ message: "UnAuthorized access" });
	}
	const token = authHeader.split(" ")[1];
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
		if (err) {
			return res.status(403).send({ message: "Forbidden access" });
		}
		req.decoded = decoded;
		next();
	});
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sfman.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});
async function run() {
	try {
		// perform actions on the collection object
		await client.connect();
		const productCollection = client.db("lukas").collection("products");
		const userCollection = client.db("lukas").collection("users");

		// get all products
		app.get("/product", async (req, res) => {
			const products = await productCollection.find().toArray();
			res.send(products);
		});

		// get a specific product by filtering id
		app.get("/product/:id", verifyToken, async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await productCollection.findOne(query);
			res.send(result);
		});

		// user
		app.put("/user/:email", async (req, res) => {
			const user = req.body;
			const email = req.params.email;
			const filter = { email: email };
			const options = { upsert: true };
			const updateDoc = {
				$set: user,
			};
			const result = await userCollection.updateOne(filter, updateDoc, options);
			const token = jwt.sign(
				{ email: email },
				process.env.ACCESS_TOKEN_SECRET,
				{ expiresIn: "5h" }
			);
			res.send({ result, token });
		});
	} finally {
	}
}

run().catch(console.dir);

app.listen(port, console.log("server is running"));
