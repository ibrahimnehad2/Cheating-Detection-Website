const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const { setupExamPublisher } = require("./scheduler"); 

const app = express();

mongoose.connect("mongodb://127.0.0.1:27017/Prevent-Cheating")
  .then(() => console.log("DB CONNECTED"))
  .catch(err => console.log(`DB CONNECTION ERR: ${err}`));

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// routes
app.use("/admin", require("./routes/admin"));
app.use("/teacher", require("./routes/teacher"));
app.use("/auth", require("./routes/auth"));
app.use("/exams", require("./routes/exams"));
app.use("/record", require("./routes/record"));

// Start the server
const PORT = 15000;
app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});

// Start the CRON job => publishes exams as soon as startDate passes
setupExamPublisher();
