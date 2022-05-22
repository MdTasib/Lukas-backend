const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();
const app = express();

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
	res.send("Lukas server is running");
});

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

		// get all products
		app.get("/product", async (req, res) => {
			const products = await productCollection.find().toArray();
			res.send(products);
		});
	} finally {
	}
}

run().catch(console.dir);

app.listen(port, console.log("server is running"));
