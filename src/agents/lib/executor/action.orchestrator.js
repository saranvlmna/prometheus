import pluginRegistry from "../plugins/plugin.registry.js";
import Action from "../../../../database/model/action.model.js";


export const orchestrateActions = async (
    analysis,
    sourceData,
    user,
    oAuth2Client,
    options = { autoExecute: false, source: "gmail" }
) => {
    const report = {
        sourceId: sourceData.id,
        importance: analysis.importance,
        audience: analysis.audience,
        summary: analysis.summary,
        executed: [],
        skipped: [],
        failed: [],
    };

    if (analysis.importance === "ignore" || (analysis.actions && analysis.actions.length === 0)) {
        console.log(`[Orchestrator] Skipping ${options.source} ${sourceData.id} — importance: ${analysis.importance}`);
        return report;
    }

    const context = {
        oAuth2Client,
        sourceData,
        user,
        jiraProjectKey: user.jiraProjectKey || process.env.JIRA_PROJECT_KEY,
    };

    const actions = Array.isArray(analysis.actions) ? analysis.actions : [];

    const actionTasks = actions.map(async (action) => {
        const plugin = pluginRegistry.get(action.type);

        if (!plugin) {
            console.warn(`[Orchestrator] No plugin found for type: "${action.type}"`);
            report.skipped.push({ type: action.type, reason: "No plugin registered" });
            return;
        }

        if (plugin.validate) {
            const { valid, errors } = plugin.validate(action);
            if (!valid) {
                console.warn(`[Orchestrator] Validation failed for ${action.type}:`, errors);
                report.skipped.push({ type: action.type, reason: errors.join(", ") });
                return;
            }
        }

        const status = options.autoExecute ? "executing" : "pending";

        // Create unified Action document
        const savedAction = await Action.create({
            userId: user._id,
            source: options.source,
            sourceId: sourceData.id,
            context: {
                ...sourceData.context,
                subject: sourceData.subject,
                from: sourceData.from,
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
                status: "pending",
                actionId: savedAction._id,
                message: "Saved as pending — awaiting user approval",
            });
            return;
        }

        try {
            console.log(`[Orchestrator] Executing: ${action.type} for ${options.source} ${sourceData.id}`);
            const result = await plugin.execute(action, context);

            const finalStatus = result.success ? "completed" : "failed";
            await Action.findByIdAndUpdate(savedAction._id, {
                status: finalStatus,
                executedAt: new Date(),
                executionResult: result.result || null,
                errorMessage: result.error || null,
            });

            if (result.success) {
                report.executed.push({
                    type: action.type,
                    status: "completed",
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
        } catch (err) {
            console.error(`[Orchestrator] Unexpected error in ${action.type}:`, err.message);
            await Action.findByIdAndUpdate(savedAction._id, {
                status: "failed",
                errorMessage: err.message,
            });
            report.failed.push({ type: action.type, error: err.message });
        }
    });

    await Promise.allSettled(actionTasks);

    console.log(
        `[Orchestrator] Done for ${options.source} ${sourceData.id} — ` +
        `executed: ${report.executed.length}, skipped: ${report.skipped.length}, failed: ${report.failed.length}`
    );

    return report;
};
