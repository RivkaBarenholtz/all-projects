import express from "express";
import { handler as GetClient } from "./client.js"; // use ES module import
import { handler as CreateReceipt  } from "./index.js"; // use ES module import

const app = express();
app.use(express.json());

// Define your API endpoint
app.post("/get-client", async (req, res) => {
  try {
    const  accountInput  = req.body;

    // Call your Lambda-style function
    const result = await GetClient(accountInput);

    res.status(result.statusCode || 200).send(result.body);
  } catch (error) {
    console.error("Error running Playwright:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/add-new-receipt", async (req, res) => {
  try {
    const  accountInput  = req.body;

    // Call your Lambda-style function
    const result = await CreateReceipt(accountInput);
    res.status(result.statusCode || 200).send(result.body);
  } catch (error) {
    console.error("Error running Playwright:", error);
    res.status(500).json({ error: error.message });
  }
});

// Optional: a simple GET route to test the server
app.get("/", (req, res) => {
  res.send("Playwright API is running!");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Server running on port ${PORT}`)
);