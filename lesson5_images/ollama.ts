import {Ollama} from 'ollama'
import { Model } from './model'

// @ts-ignore
const ollama = new Ollama({
	host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
});

export const  getDataFromImage = async ({
    image,prompt,model
}:{
    image: string,
    prompt: string,
    model: Model
}) => {
const res = await ollama.chat({
	model: Model.GEMMA3_12B,
    url: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    
	messages: [{
		role: 'user',
		content: prompt,
		images: [image]
	}]
});
return res;
}

