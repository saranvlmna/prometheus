import dotenv from "dotenv";
import { AzureOpenAI } from "openai";
dotenv.config();

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const apiVersion = process.env.AZURE_API_VERSION;
const deployment = process.env.AZURE_DEPLOYMENT;

export default function createAzureClient() {
  try {
    if (!endpoint || !apiKey || !apiVersion || !deployment) {
      throw new Error("Missing Azure OpenAI environment variables");
    }

    const client = new AzureOpenAI({
      endpoint,
      apiKey,
      apiVersion,
      deployment,
    });

    return client;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
