import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const port = 3001; // or any port you prefer

app.use(cors());
app.use(express.json());

app.post('/api/fetch-next-query', async (req, res) => {
  const { userInput, userChoice, conversationHistory } = req.body;

  const REACT_APP_OPENAI_API_KEY = '';
  const MAX_RETRIES = 3;

  const messages = [
    {
      role: 'system',
      content: `
      You are a shopping assistant bot. Guide the user to find the best product by asking questions and providing choices like single choice, multiple choice, or free text based on the user’s needs.
      Always respond in the following JSON format:
      {
        "query": "Next question to ask the user",
        "type": "single | multiple | free-text",
        "choices": ["Option 1", "Option 2", "Option 3"]
      }`,
    },
    ...conversationHistory,
    {
      role: 'user',
      content: userChoice ? `${userInput}: ${userChoice}` : userInput,
    },
  ];

  let attempts = 0;
  let success = false;
  let data;

  while (attempts < MAX_RETRIES && !success) {
    try {
      attempts += 1;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: messages,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${REACT_APP_OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          }
        }
      );

      data = response.data.choices[0].message.content;

      try {
        const parsedData = JSON.parse(data);
        success = true;
        res.json(parsedData);
      } catch (jsonError) {
        if (attempts >= MAX_RETRIES) {
          res.json({ query: data.trim(), type: 'free-text', choices: [] });
        }
      }
    } catch (error) {
      if (attempts >= MAX_RETRIES) {
        res.status(500).send('Error fetching data after multiple attempts');
      }
    }
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
