import { Annotation } from '@langchain/langgraph';
import { StateGraph, MemorySaver } from '@langchain/langgraph';


const ResearchState = Annotation.Root({

});

const workflow = new StateGraph(ResearchState)


const checkpointer = new MemorySaver();
const app = workflow.compile({
  checkpointer
})

app.invoke('')
