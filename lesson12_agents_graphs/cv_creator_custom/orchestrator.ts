import {
  Annotation,
  interrupt,
  MemorySaver,
  StateGraph,
} from '@langchain/langgraph';
import { type CV_Structure, createCVFromText } from './dataPrepare.ts';




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
  return { cv: result.data.cv, questionsToUser: result.data.questionsToUser, requiredData:result?.data?.meta?.requiredData };
}



async function askUserNode(state: CVStateType) {
  const answers = state.questionsToUser.map((question) => ({
    question,
    answer: interrupt<string, string>(question),
  }));
  const userAnswer = answers
    .map(({ question, answer }) => `Question: ${question}\nAnswer: ${answer}`)
    .join('\n\n');

  return {
    userAnswer,
    candidateText: `${state.candidateText}\n\nAdditional information from the candidate:\n${userAnswer}`,
    questionsToUser: [],
  };
}

function afterExtract(state: CVStateType): "askUser" | "__end__" {
  return state.questionsToUser.length > 0 ? "askUser" : "__end__";
}

function checkExtractedDataNode(state: CVStateType) {
  return state
}


const workflow = new StateGraph(CVState)
  .addNode("extract", extractNode)
  .addNode("askUser", askUserNode)
  .addNode('checkExtractedData',checkExtractedDataNode)
  .addEdge("__start__", "extract")
  .addEdge("extract", "checkExtractedData")
  .addConditionalEdges("checkExtractedData", afterExtract, {
    askUser: "askUser",
    __end__: "__end__",
  })
  .addEdge("askUser", "extract");



const checkpointer = new MemorySaver();
export const app = workflow.compile({
  checkpointer,
});

export function createConfig(threadId: string) {
  return { configurable: { thread_id: threadId } };
}
