import generateDialogueHandler from "../netlify/functions/generate-dialogue.js";
import { runWebHandler } from "./_netlifyAdapter.js";

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  return runWebHandler(generateDialogueHandler, req, res);
}
