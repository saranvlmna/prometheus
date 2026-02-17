import { AzureOpenAI } from "openai";

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const apiVersion = process.env.AZURE_API_VERSION;
const deployment = process.env.AZURE_DEPLOYMENT;

export const azureOpenAIClient = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion,
    deployment
});
