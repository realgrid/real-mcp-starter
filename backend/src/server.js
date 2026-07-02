const express = require('express');
const cors = require('cors');
const { port } = require('./config');
const netflixRoutes = require('./routes/netflix');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/netflix', netflixRoutes);

app.listen(port, () => {
  console.log(`Netflix Admin API server running on http://localhost:${port}`);
});
