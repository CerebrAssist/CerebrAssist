import { marked } from 'https://cdn.jsdelivr.net/npm/marked@15.0.7/+esm'
import dompurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.2.4/+esm'
import Cerebras from 'https://cdn.jsdelivr.net/npm/@cerebras/cerebras_cloud_sdk/+esm';

const messagesDiv = document.getElementById('messages');

const userInput = document.getElementById('userInput');

const apiKeyModal = document.getElementById('apiKeyModal');

const apiKeyInput = document.getElementById('apiKeyInput');

let cerebrasClient = null;

let conversationHistory = [];

let storedApiKey = localStorage.getItem("cerebrasApiKey") || "";

if (storedApiKey) {

    initClient(storedApiKey);

    apiKeyModal.style.display = 'none';

} else {

    apiKeyModal.style.display = 'flex';

}

function parseMarkdown(text) {

    const rawHTML = marked(text);

    return dompurify.sanitize(rawHTML);

}

function initClient(apiKey) {

    if (cerebrasClient && cerebrasClient.apiKey === apiKey) {

        return cerebrasClient;

    }

    cerebrasClient = new Cerebras({ apiKey });

    return cerebrasClient;

}

async function sendMessage() {

    const userMessage = userInput.value;

    if (!userMessage || !storedApiKey) return;

    conversationHistory.push({ role: 'user', content: userMessage });

    addMessage('user', userMessage);

    userInput.value = '';

    userInput.style.height = 'auto';

    const responseElement = addMessage('assistant', '');

    try {

        const client = initClient(storedApiKey);

        const stream = await client.chat.completions.create({

            messages: conversationHistory,

            model: 'llama-3.3-70b',

            stream: true,

        });

        let responseText = '';

        for await (const chunk of stream) {

            const content = chunk.choices[0]?.delta?.content || '';

            responseText += content;

            responseElement.innerHTML = parseMarkdown(responseText);

            messagesDiv.scrollTop = messagesDiv.scrollHeight;

        }

        conversationHistory.push({ role: 'assistant', content: responseText });

    } catch (error) {

        responseElement.textContent = 'Error: ' + error.message;

        console.error(error);

    }

}

function addMessage(role, content) {

    const messageDiv = document.createElement('div');

    messageDiv.className = `message ${role}`;

    messageDiv.textContent = content;

    messagesDiv.appendChild(messageDiv);

    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    return messageDiv;

}

userInput.addEventListener('input', function () {

    this.style.height = 'auto';

    this.style.height = Math.min(this.scrollHeight, 200) + 'px';

});

userInput.addEventListener('keydown', (e) => {

    if (e.key === 'Enter' && !e.shiftKey) {

        e.preventDefault();

        sendMessage();

    }

});

apiKeyInput.addEventListener('keydown', (e) => {

    if (e.key === 'Enter') {

        e.preventDefault();

        const apiKey = apiKeyInput.value.trim();

        if (apiKey === "") {

            return;

        }

        localStorage.setItem("cerebrasApiKey", apiKey);

        storedApiKey = apiKey;

        initClient(storedApiKey);

        apiKeyModal.style.display = 'none';

    }

});