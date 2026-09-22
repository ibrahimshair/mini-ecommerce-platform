const express = require("express");

const app = express();

const PORT = 5000;

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Mini E-Commerce API is running"
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});