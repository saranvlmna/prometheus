import { STATUS } from "../../../../shared/constants/system.js";
import actionCreate from "../../../actions/lib/action.create.js";
import actionUpdate from "../../../actions/lib/action.update.js";
import pluginRegistry from "../plugins/plugin.registry.js";

export default async (analysis, emailData, user, oAuth2Client, options = { autoExecute: false }) => {
  try {
    const report = {
      emailId: emailData.id,
      importance: analysis.importance,
      audience: analysis.audience,
      summary: analysis.summary,
      executed: [],
      skipped: [],
      failed: [],
    };

    if (analysis.importance === STATUS.IGNORE || analysis.actions.length === 0) {
      console.log(`[Orchestrator] Skipping email ${emailData.id} — importance: ${analysis.importance}`);
      return report;
    }

    const context = {
      oAuth2Client,
      emailData,
      user,
      jiraProjectKey: user.jiraProjectKey || process.env.JIRA_PROJECT_KEY,
    };

    const actionTasks = analysis.actions.map(async (action) => {
      const plugin = pluginRegistry.get(action.type);

      if (!plugin) {
        console.log(`[Orchestrator] No plugin found for type: "${action.type}"`);
        report.skipped.push({ type: action.type, reason: "No plugin registered" });
        return;
      }

      if (plugin.validate) {
        const { valid, errors } = plugin.validate(action);
        if (!valid) {
          console.log(`[Orchestrator] Validation failed for ${action.type}:`, errors);
          report.skipped.push({ type: action.type, reason: errors.join(", ") });
          return;
        }
      }

      const status = options.autoExecute ? STATUS.EXECUTING : STATUS.PENDING;

      const savedAction = await actionCreate({
        userId: user._id,
        source: "gmail",
        sourceId: emailData.id,
        context: {
          threadId: emailData.threadId,
          subject: emailData.subject,
          from: emailData.from,
        },
        type: action.type,
        status,
        priority: action.priority || "medium",
        title: action.title || action.summary || "Action",
        description: analysis.summary,
        payload: action,
        reasoning: analysis.reasoning,
        confidence: action.confidence,
      });

      if (!options.autoExecute) {
        report.executed.push({
          type: action.type,
          status: STATUS.PENDING,
          actionId: savedAction._id,
          message: "Saved as pending — awaiting user approval",
        });
        return;
      }

      console.log(`[Orchestrator] Executing: ${action.type} for email ${emailData.id}`);
      const result = await plugin.execute(action, context);

      const finalStatus = result.success ? STATUS.COMPLETED : STATUS.FAILED;
      await actionUpdate(savedAction._id, {
        status: finalStatus,
        executedAt: new Date(),
        executionResult: result.result || null,
        errorMessage: result.error || null,
      });

      if (result.success) {
        report.executed.push({
          type: action.type,
          status: STATUS.COMPLETED,
          actionId: savedAction._id,
          result: result.result,
        });
      } else {
        report.failed.push({
          type: action.type,
          actionId: savedAction._id,
          error: result.error,
        });
      }
    });

    await Promise.allSettled(actionTasks);

    console.log(
      `[Orchestrator] Done for ${emailData.id} — ` +
        `executed: ${report.executed.length}, skipped: ${report.skipped.length}, failed: ${report.failed.length}`,
    );

    return report;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
