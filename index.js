require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const routes = require("./src/route");
const {createServer} = require('http');
const {Server} = require("socket.io")

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors:{
    origin:"*",
    methods:["GET", "POST"],
    credentials:true,
  }
})

app.use('/uploads', express.static('uploads'))
const PORT = process.env.PORT || 8000;


app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());




// connecting with database
const mongoose = require("mongoose");
mongoose.connect(process.env.DB_STRING
).then(()=>{
    console.warn("db connection done again")
})

// Pass the `io` instance to routes
app.use((req, res, next) => {
  req.io = io; // Attach the `io` object to the request
  next();
});

app.get("/", (req, res) => res.send(`Server listing on port ${PORT}`));
app.use("/api", routes);
app.all("*", (req, res) => res.status(404).json({ error: "404 Not Found " })); 



server.listen(PORT, () =>
  console.log(`Server running on  ${process.env.BACKEND_URL}`)
);