import { Agenda } from "agenda";
import { MongoBackend } from "@agendajs/mongo-backend";
import { registerEmailCampaignJob } from "../jobs/emailCampaignJob.js";

let agendaInstance;

export const initAgenda = async () => {
  if (agendaInstance) return agendaInstance;

  agendaInstance = new Agenda({
    backend: new MongoBackend({
      address: process.env.MONGODB_URI,
      collection: process.env.AGENDA_COLLECTION || "agendaJobs",
    }),
    processEvery: process.env.AGENDA_PROCESS_EVERY || "60 seconds",
    defaultConcurrency: Number(process.env.AGENDA_DEFAULT_CONCURRENCY || 5),
    maxConcurrency: Number(process.env.AGENDA_MAX_CONCURRENCY || 20),
  });

  registerEmailCampaignJob(agendaInstance);
  await agendaInstance.start();

  console.log("Agenda job processor started");
  return agendaInstance;
};

export const getAgenda = () => agendaInstance;

export const stopAgenda = async () => {
  if (!agendaInstance) return;
  await agendaInstance.stop();
  agendaInstance = null;
};
