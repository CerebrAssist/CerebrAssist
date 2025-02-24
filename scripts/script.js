import { marked } from 'https://cdn.jsdelivr.net/npm/marked@15.0.7/+esm'
import dompurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.2.4/+esm'
import Cerebras from 'https://cdn.jsdelivr.net/npm/@cerebras/cerebras_cloud_sdk/+esm';

const deleteButton = document.getElementById("deleteButton");

const messagesContainer = document.getElementById('messagesContainer');

const input = document.getElementById('input');

const sendButton = document.getElementById('sendButton');

let cerebrasClient = null;

let conversationHistory = [];

let storedApiKey = "csk-x836edmhrreyymxyyh4np8tdp9jdnkkyen326ervwrxh6k6w";

initClient(storedApiKey);

function initClient(apiKey) {

    if (cerebrasClient && cerebrasClient.apiKey === apiKey) {

        return cerebrasClient;

    }

    cerebrasClient = new Cerebras({ apiKey });

    return cerebrasClient;

}

function parseMarkdown(text) {

    const rawHTML = marked(text);

    return dompurify.sanitize(rawHTML);

}

async function sendMessage() {

    const userMessage = input.value;

    if (!userMessage || !storedApiKey) return;

    conversationHistory.push({ role: 'user', content: userMessage });

    addMessage('user', userMessage);

    input.value = '';

    input.style.height = 'auto';

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

            messagesContainer.scrollTop = messagesContainer.scrollHeight;

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

    messagesContainer.appendChild(messageDiv);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageDiv;

}

input.addEventListener('input', function () {

    this.style.height = 'auto';

    this.style.height = Math.min(this.scrollHeight, 200) + 'px';

});

input.addEventListener('keydown', (e) => {

    if (e.key === 'Enter' && !e.shiftKey) {

        e.preventDefault();

        sendMessage();

    }

});

sendButton.addEventListener('click', sendMessage);

if ('serviceWorker' in navigator) {

    window.addEventListener('load', () => {

        navigator.serviceWorker.register('./sw.js')

            .then(registration => {

                console.log('Service Worker successfully registered :', registration);

            })

            .catch(error => {

                console.error('Service Worker registration failed :', error);

            });

    });

}

deleteButton.addEventListener("click", () => {

    conversationHistory = [];

    messagesContainer.innerHTML = '';

});