import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.use(cors());
app.post('/', (req, res) => {
    console.log('Upload request received:', req.body);
    res.send('Upload request received');
});

app.post('/', (req, res) => {
    console.log('Log request received:', req.body);
    res.send('Log request received');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});