import answerHandler from "../netlify/functions/answer.js";
import { runWebHandler } from "./_netlifyAdapter.js";

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  return runWebHandler(answerHandler, req, res);
}
