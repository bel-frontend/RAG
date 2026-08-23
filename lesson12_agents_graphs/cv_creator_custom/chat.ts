/* eslint-disable */
import * as path from "path";
import * as dotenv from "dotenv";
import { z } from "zod";
import { Annotation } from '@langchain/langgraph';
import { StateGraph, MemorySaver } from '@langchain/langgraph';


import { chatModel, Model } from "../../common/model.ts";

// import { prisma } from "../db";

dotenv.config({ path: path.resolve(__dirname, "../.env") });



const ResearchState = Annotation.Root({

});

const workflow = new StateGraph(ResearchState)


const checkpointer = new MemorySaver();
const app = workflow.compile({
  checkpointer
})

app.invoke('')
