import TelegramBot from 'node-telegram-bot-api';
import { chatModel, Model } from './model';
import fetch from 'node-fetch';
import { getDataFromImage } from './ollama';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN');

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        'Welcome! Send me an image, and I will analyze it for you.'
    );
});

bot.on('photo', async (msg) => {
    const userId = msg.chat.id;
    bot.sendMessage(userId, 'Processing your image...');

    try {
        // Get the file ID of the largest photo
        const fileId = msg.photo[msg.photo.length - 1].file_id;

        // Get the file URL
        const file = await bot.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

        // Fetch the image and convert it to Base64
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const buffer = await response.buffer();
        const base64Image = buffer.toString('base64');

        // Send the Base64 image to the model for analysis
        bot.sendChatAction(userId, 'typing');
        const prompt = `You are an AI image analyzer. Analyze the content of the image and provide a detailed description. 
        If we have some text on image return  this text and  summary of the text.`;
        const res = await getDataFromImage({
            image: base64Image,
            prompt,
            model: Model.GEMMA3_12B,
        });

        // Send the result back to the user
        bot.sendMessage(userId, `Analysis Result:\n\n${res.message.content}`);
        console.log('Analysis Result:', res.message.content);
    } catch (err: any) {
        console.error('Error:', err);
        bot.sendMessage(userId, 'Error processing the image: ' + err.message);
    }
});
