import ollama from 'ollama'
import { Model } from './model'

export const  getDataFromImage = async ({
    image,prompt,model
}:{
    image: string,
    prompt: string,
    model: Model
}) => {


const res = await ollama.chat({
	model: Model.GEMMA3_12B,
	messages: [{
		role: 'user',
		content: prompt,
		images: [image]
	}]
});
return res;
}

