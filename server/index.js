require('dotenv').config(); // loads variables from .env file
const express = require('express')
const { createClient } = require('@supabase/supabase-js');


const app = express();
app.use(express.json());
const { exec } = require("child_process");

// server/index.js
const cors = require("cors");

// Enable CORS for all origins (during dev)
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



// Connect to Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Test route
app.get('/', (req, res) => {
    res.send("Hello World from Office Space Optimizer API!");
});


app.listen(PORT, () => {
    console.log('Server running on http://localhost:${PORT}');
});

// Get all desks
app.get('/api/desks', async (req, res) => {
  const { data, error } = await supabase.from('desks').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Add a new desk
app.post('/api/desks', async (req, res) => {
  const { desk_code, location_x, location_y, department } = req.body;
  const { data, error } = await supabase.from('desks').insert([{ desk_code, location_x, location_y, department }]);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Add usage log
app.post('/api/usage', async (req, res) => {
  const { desk_code, date, used } = req.body;

  // Get desk id from desk_code
  const { data: desk } = await supabase.from('desks').select('id').eq('desk_code', desk_code).single();
  if (!desk) return res.status(400).json({ error: 'Desk not found' });

  const { data, error } = await supabase.from('usage_logs').insert([{ desk_id: desk.id, date, used }]);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get usage logs
app.get('/api/usage', async (req, res) => {
  const { data, error } = await supabase.from('usage_logs').select('*, desks(*)');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

const path = require("path");

app.post("/api/update-desks", (req, res) => {
  // Resolve the path to the python script relative to the server folder
  const scriptPath = path.join(__dirname, "..", "python", "predict_desk_usage.py");

  exec(`python3 "${scriptPath}"`, (err, stdout, stderr) => {
    if (err) {
      console.error("Python script error:", stderr);
      return res.status(500).json({ error: stderr || "Python script failed" });
    }

    // Optionally parse stdout if Python prints JSON
    try {
      const result = JSON.parse(stdout);
      res.json(result);
    } catch {
      res.json({ message: "Desk usage updated successfully", output: stdout });
    }
  });
});


// DELETE a desk by ID
app.delete("/api/desks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Deleting desk with id:", id);

    const { data, error } = await supabase
      .from("desks")
      .delete()
      .eq("id", parseInt(id)); // make sure types match

    if (error) {
      console.error("Supabase delete error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Desk deleted", data });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/desks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { used } = req.body;

    const { data, error } = await supabase
      .from("desks")
      .update({ used })
      .eq("id", parseInt(id));

    if (error) {
      console.error("Supabase update error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Desk usage updated", data });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



