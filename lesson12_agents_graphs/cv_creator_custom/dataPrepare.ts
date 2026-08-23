/* eslint-disable */
import * as path from 'path';
import * as dotenv from 'dotenv';
import { z } from 'zod';

import { chatModel, Model } from '../../common/model.ts';
import { log,dir } from 'console';

// import { prisma } from "../db";

dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') });

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

interface CVExperience {
    company: string;
    role: string;
    startDate: string;
    endDate: string | null;
    description: string | null;
}

interface CVEducation {
    institution: string;
    degree: string;
    startDate: string;
    endDate: string | null;
}

export interface CV_Structure {
    fullName: string;
    targetRole: string;
    experience: CVExperience[];
    education: CVEducation[];
    skills: string[];
}

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

/** Everything the extraction agent produces from a (resume, vacancy) pair. */
interface CVOrchestrationState {
    /** Data derived from the vacancy text, e.g. which CV fields it requires. */
    meta: {
        requiredData: string[];
    };
    cv: CV_Structure;
    questionsToUser:string[]
}

/** Generic envelope every agent in the chain hands off to the next one. */
interface AgentResult<T> {
    agentName: string;
    data: T;
}


// ---------------------------------------------------------------------------
// Zod schemas — runtime mirrors of the domain types above, required by
// `withStructuredOutput`. OpenAI's structured outputs need every property to
// stay in `required`, so optional values are modeled as `.nullable()` rather
// than `.optional()`.
// ---------------------------------------------------------------------------

const ParsedCVSchema = z.object({
    fullName: z.string().describe('Full name of the candidate'),
    targetRole: z.string().describe('Target role from vacancy'),
    experience: z
        .array(
            z.object({
                company: z.string().describe('Company name'),
                role: z.string().describe('Job title / role'),
                startDate: z.string().describe('Start date'),
                endDate: z
                    .string()
                    .nullable()
                    .describe('End date, or null if still ongoing'),
                description: z
                    .string()
                    .nullable()
                    .describe('Summary of responsibilities, or null if none'),
            })
        )
        .describe('Work experience entries'),
    education: z
        .array(
            z.object({
                institution: z.string().describe('Institution name'),
                degree: z.string().describe('Degree or qualification'),
                startDate: z.string().describe('Start date'),
                endDate: z
                    .string()
                    .nullable()
                    .describe('End date, or null if still ongoing'),
            })
        )
        .describe('Education entries'),
    skills: z
        .array(z.string())
        .describe(
            'List of important to vacancy skills, that show users advanctages, sorted by matching'
        ),
});

const ChatMessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
});

const CVOrchestrationStateSchema = z.object({
  meta: z.object({
    requiredData: z
      .array(z.string())
      .describe('CV fields the vacancy text requires'),
  }),
  cv: ParsedCVSchema,
  questionsToUser: z.array(z.string()).describe('Questions to ask the user that will help clarify the information required for the best ATS-adapted CV')
});

export async function createCVFromText(
    userId: string,
    inputText: string,
    vacancyText: string
): Promise<AgentResult<CVOrchestrationState>> {
    const extractorLlm = await chatModel(Model.GPT5_5, {
        apiKey: process.env.OPENAI_API_KEY,
    });

    const extractCv = extractorLlm.withStructuredOutput(
        CVOrchestrationStateSchema,
        { name: 'extract_cv' }
    );

    const prompt =
        `You are an expert CV writer. Your goal is to prepare the best possible ` +
        `ATS-adapted CV for this candidate, built around the target vacancy below — ` +
        `the vacancy drives what goes in and how it's prioritized, not just a filter ` +
        `applied afterwards.\n\n` +
        `Vacancy:\n${vacancyText}\n\n` +
        `Candidate info:\n${inputText}\n\n` +
        `Extract a structured CV from the candidate info, shaped by the vacancy: ` +
        `set targetRole from the vacancy's title, and order/select experience and ` +
        `skills entries by relevance to the vacancy (most relevant first), omitting ` +
        `candidate details the vacancy gives no weight to. Optimize wording to pass ` +
        `Applicant Tracking Systems (ATS). List the CV fields the vacancy requires ` +
        `in meta.requiredData, and any clarifying questions for the candidate in ` +
        `questionsToUser.`;

    // Cast: withStructuredOutput's inferred type marks fields optional even
    // though the schema requires them; checkStateOfCV validates completeness
    // downstream.
    const data = (await extractCv.invoke(prompt)) as CVOrchestrationState;
    return { agentName: 'extract_cv', data: data };
}

const CV_REQUIRED_FIELDS: (keyof CV_Structure)[] = [
    'fullName',
    'experience',
    'education',
    'skills',
];

// ---------------------------------------------------------------------------
// Example run
// ---------------------------------------------------------------------------

export const candidateText = `
  Siarhei Petrashka

  Senior Software Engineer / Senior Web Application Developer
  Warsaw, Mazowieckie, Poland
  piotrazsko@gmail.com
  Professional Summary

  Siarhei Petrashka is a Senior Software Engineer with over 10 years of experience in developing advanced web applications and systems in an AI-native environment. He has strong expertise in TypeScript and proficiency with tools such as Cursor, Claude, and Google Gemini, focusing on process automation, UX, and client-side state management. His notable achievements include creating a LangGraph-based system for community integration, enhancing multi-agent systems, and engineering an invoice management system for a Swiss medical company, ensuring data integrity and financial validation. Siarhei is committed to delivering high-quality software solutions while collaborating effectively in dynamic environments.
  Experience
  Senior Software Engineer
  Feb 2022 – Present
  Klika Tech, Inc.

      Developed a LangGraph-based system to integrate communities into the company management system, leveraging tools in an AI-native environment including Claude Code and Google Gemini.
      Utilized advanced technologies such as TypeScript and LangChain to enhance multi-agent systems and improve user experience (UX) in complex workflows.
      Created custom dashboard editing systems that improved creation and editing speed by 40%, reducing work from several hours to 20–30 minutes.
      Employed Cursor in professional software engineering work.

  Senior Software Engineer
  May 2021 – Feb 2022
  Calkam

      Delivered a mobile application utilizing React Native and a backend built with Fastify and MongoDB, focusing on process automation and client-side state management.
      Contributed to the software engineering team with a customer-focused approach, ensuring high-quality deliverables in a dynamic environment.

  Senior Web Application Developer
  Nov 2019 – May 2021
  FeelQueen

      Engineered an invoice management system for a Swiss medical company, implementing financial validation and structured document data processing using React and Redux.
      Improved data integrity and workflow efficiency through the development of a web interface for invoice editing, enhancing user interaction and satisfaction.

  Website Developer
  Oct 2018 – Nov 2019
  REDNAVIS

      Collaborated in the development of a CRM and invoice management system, focusing on financial validation and accounting workflows.
      Leveraged React and Redux to create responsive user interfaces that facilitated real-time data interaction and management.

  Full-Stack Developer
  Jan 2016 – Oct 2018
  SpriTecs

      Designed and implemented an Invoices Creator project using PHP 7 and Laravel, contributing to full-cycle custom web development services.
      Utilized JavaScript (ES6/ES7) along with React and Redux for building dynamic web applications, ensuring high performance and scalability.

  Education
  Bachelor’s degree
  Belarusian State University of Informatics and Radioelectronics • 2010 — 2014
  Skills
  Artificial IntelligenceMulti-agent SystemsLangChainHugging Face ProductsGoogle GeminiOpenAI CodexClaude CodeGenerative AIPrompt DesignVertex AIMongoDB AtlasJavaScriptTypeScriptReactReact.jsReact NativeReduxNext.jsHTMLHTML5CSSSCSSSASSBootstrapMaterial UIAnt DesignjQueryNode.jsWebSocketsJSONGitBashWebpackGruntJSGulpSoftware DevelopmentWeb DevelopmentFull-Stack DevelopmentObject-Oriented ProgrammingCRM developmentLLM-powered applicationsAI-assisted systemsRemote Team CollaborationCursorOCRRAGRetrieval-Augmented GenerationLangGraphFastifyMongoDBFinancial data qualityVue.jsCustom dashboardsDashboard editing systemsAI-powered localization
  Certifications

      Getting Started with MongoDB Atlas on Google Cloud - Google (July 2024)
      Develop GenAI Apps with Gemini and Streamlit - Google (June 2024)
      Prompt Design in Vertex AI - Google (May 2024)
      Getting Started with MongoDB Atlas on Google Cloud - Google (July 2024), Credential ID: 9898604
      Develop GenAI Apps with Gemini and Streamlit - Google (June 2024), Credential ID: 9357760

  Projects

      zaspa.onlibe
      goman.live — personal AI project that helps with fast and simple application localization.
      passcv.app — AI assistant.
      AI bots for translations, data filtering, and other automation tasks.

  Languages
  RussianBelarussianPolishEnglish - B2
`;

export const vacancyText = `
  Senior Software Engineer (AI, OCR/IDP & Automation)
  Stack: TypeScript (primary), Python/Go/Rust (plus), SQL/NoSQL
  Tools: AI-native environment
  Location: Poland
  Relocation to Copenhagen, Denmark is available after 6 months, if desired.
  The Mission: Force Multiplier
  We are building a “force multiplier” for accounting. As an AI-native startup, we leverage advanced technology to automate complex financial workflows — reducing hours of manual validation to seconds of precise automation.
  We’re looking for a Senior Engineer who knows that code only matters when it solves real user problems. You’ll dive into the complexity of day-to-day accounting operations, uncover the underlying logic, and build systems that automate, validate, and ensure the quality of financial data.
  What You’ll Work On
  Core Logic: Turn complex, human-driven accounting workflows into clear, deterministic business logic. Understand the reasoning behind every transaction.
  Data Ingestion (IDP): Develop pipelines to process raw financial documents, clean them, and convert them into structured data.
  AI & Predictive Systems: Build AI agents that take real actions and deliver tangible outcomes — beyond simple chat interfaces.
  Process Automation: Identify bottlenecks in customer workflows and remove them through automation.
  UI Contributions: Support improvements in UX and client-side state management.
  Tech Stack
  Core: Strong expertise in TypeScript (expert level) with a focus on type safety and high code quality.
  Data: Solid understanding of databases, financial data modeling, and data integrity.
  AI Workflow: Proficiency with Cursor, Claude, and Gemini to speed up development and refactoring.
  Plus: Experience with Python, Go, Rust, or Java for backend and data processing tasks.
  Who You Are
  Direct & Energetic: Communicate clearly, challenge weak solutions, and contribute positively to team dynamics.
  Customer-Focused: Willing to learn the less exciting parts of accounting to build impactful solutions.
  Execution-Oriented: You don’t stop at prototypes — you deliver production-ready, well-tested features.
  Adaptable: Comfortable working in a fast-moving environment and learning as things evolve.
  What We Offer

  Competitive salary
  Working at an early stage of the product
  Having real impact on decisions and architecture
  Direct communication with the founders,
  Fast processes without bureaucracy, and support from strong investors
  Working hours are aligned with the European time zone
`;

// const userId = '';

// const data = await createCVFromText(userId, candidateText, vacancyText);

// dir(data)

// console.log(data, state);
