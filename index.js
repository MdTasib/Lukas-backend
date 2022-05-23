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
		// database collections
		const productCollection = client.db("lukas").collection("products");
		const userCollection = client.db("lukas").collection("users");
		const userProfileCollection = client.db("lukas").collection("userProfiles");
		const purchaseCollection = client.db("lukas").collection("purcahses");
		const reviewCollection = client.db("lukas").collection("reviews");

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

		// purchase product
		app.post("/product", async (req, res) => {
			const product = req.body;
			const result = await purchaseCollection.insertOne(product);
			res.send(result);
		});

		// update product quantity
		app.put("/product/:id", async (req, res) => {
			const id = req.params.id;
			const product = req.body;
			const filter = { _id: ObjectId(id) };
			const options = { upsert: true };
			const updateData = {
				$set: {
					available: product.newQuantity,
				},
			};

			const result = await productCollection.updateOne(
				filter,
				updateData,
				options
			);
			res.send(result);
		});

		// get purchase booking product
		// get all bookingsnd
		app.get("/purcahses", verifyToken, async (req, res) => {
			const email = req.query.email;
			const decodedEmail = req.decoded.email;
			// you have token, but you don't see another email service
			if (email === decodedEmail) {
				const query = { userEmail: email };
				const bookings = await purchaseCollection.find(query).toArray();
				res.send(bookings);
			}
		});

		// user delete product
		app.delete("/purcahses/:id", verifyToken, async (req, res) => {
			const id = req.params.id;
			const filter = { _id: ObjectId(id) };
			const result = await purchaseCollection.deleteOne(filter);
			res.send(result);
		});

		// post a review
		app.post("/review", verifyToken, async (req, res) => {
			const review = req.body;
			const result = await reviewCollection.insertOne(review);
			res.send(result);
		});

		// get all reviews
		app.get("/review", async (req, res) => {
			const reviews = await reviewCollection.find().toArray();
			res.send(reviews);
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
				{ expiresIn: "1h" }
			);
			res.send({ result, token });
		});

		// get a specific user profile
		app.get("/userProfile/:email", verifyToken, async (req, res) => {
			const email = req.params.email;
			const query = { email: email };
			const result = await userProfileCollection.findOne(query);
			res.send(result);
		});

		// update a user profile information
		app.put("/userProfile/:email", verifyToken, async (req, res) => {
			const user = req.body;
			const email = req.params.email;
			const filter = { email: email };
			const options = { upsert: true };
			const updateDoc = {
				$set: user,
			};

			const result = await userProfileCollection.updateOne(
				filter,
				updateDoc,
				options
			);
			res.send(result);
		});

		// upload a product
		app.post("/uploadProduct", verifyToken, async (req, res) => {
			const product = req.body;
			const result = await productCollection.insertOne(product);
			res.send(result);
		});

		// varifyAdmin function. check user is Admin
		async function verifyAdmin(req, res, next) {
			// check request email is already admin
			// if email is already admin - make an admin. otherwise don't make admin;
			const requester = req.decoded.email;
			const requesterAccount = await userCollection.findOne({
				email: requester,
			});
			if (requesterAccount.role === "admin") {
				next();
			} else {
				res.status(403).send({ message: "Forbidden" });
			}
		}

		// get all user
		app.get("/user", verifyToken, async (req, res) => {
			const users = await userCollection.find().toArray();
			res.send(users);
		});

		// make a user admin
		app.put(
			"/user/admin/:email",
			verifyToken,
			verifyAdmin,
			async (req, res) => {
				const email = req.params.email;
				const filter = { email: email };

				const updateDoc = {
					// update and add a new method is role: "admin"
					$set: { role: "admin" },
				};
				const result = await userCollection.updateOne(filter, updateDoc);
				res.send(result);
			}
		);
	} finally {
	}
}

run().catch(console.dir);

app.listen(port, console.log("server is running"));
