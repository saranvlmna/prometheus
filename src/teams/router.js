import { Router } from "express";
import graphSubscriptionCreate from "./graph.subscription.create.js";

const teamsRouter = Router();

teamsRouter.post("/subcription", graphSubscriptionCreate);

export default teamsRouter;
