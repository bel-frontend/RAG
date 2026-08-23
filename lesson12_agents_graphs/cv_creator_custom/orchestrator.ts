import { Annotation } from '@langchain/langgraph';
import { StateGraph, MemorySaver } from '@langchain/langgraph';
import { CV_Structure,createCVFromText , vacancyText, candidateText} from './dataPrepare';
import { log } from 'console';




const CVState = Annotation.Root({
  candidateText: Annotation<string>({ reducer: (_, u) => u, default: () => "" }),
  vacancyText: Annotation<string>({ reducer: (_, u) => u, default: () => "" }),
  cv: Annotation<CV_Structure | null>({ reducer: (_, u) => u, default: () => null }),
  questionsToUser: Annotation<string[]>({ reducer: (_, u) => u, default: () => [] }),
  userAnswer: Annotation<string>({ reducer: (_, u) => u, default: () => "" }),
  requiredData:Annotation<string[]>({reducer:(_,u)=>u,default:()=>[]})
});

type CVStateType = typeof CVState.State

async function extractNode(state: CVStateType) {
  const result = await createCVFromText("", state.candidateText, state.vacancyText);
  log('RESULT:',result)
  return { cv: result.data.cv, questionsToUser: result.data.questionsToUser, requiredData:result?.data?.meta?.requiredData };
}



async function askUserNode(state: CVStateType) {
  return {}
}

function afterExtract(state: CVStateType): "askUser" | "__end__" {
  log("STATE:",state)
  return state.questionsToUser.length > 0 ? "askUser" : "__end__";
}

const workflow = new StateGraph(CVState)
  .addNode("extract", extractNode)
  .addNode("askUser", askUserNode)
  .addEdge("__start__", "extract")
  .addConditionalEdges("extract", afterExtract, {
    askUser: "askUser",
    __end__: "__end__",
  })
  .addEdge("askUser", "extract");



const checkpointer = new MemorySaver();
const app = workflow.compile({
  checkpointer,
  interruptBefore: ["askUser"],
});

const config = { configurable: { thread_id: "cv-session-1" } };

const state = await app.invoke(
  { candidateText, vacancyText },
  config,
);
