import GoogleTaskPlugin from "./google_task.plugin.js";
import GmailReplyPlugin from "./gmail_reply.plugin.js";
import JiraPlugin from "./jira.plugin.js";
import CalendarReminderPlugin from "./calendar_reminder.plugin.js";

const registry = new Map();

function register(plugin) {
    if (!plugin.type || typeof plugin.execute !== "function") {
        throw new Error(
            `[PluginRegistry] Plugin must have "type" and "execute". Got: ${JSON.stringify(plugin)}`
        );
    }
    registry.set(plugin.type, plugin);
    console.log(`[PluginRegistry] ✅ ${plugin.type} → "${plugin.label}"`);
}

const get = (type) => registry.get(type) || null;
const getAll = () => Array.from(registry.values());
const getTypes = () => Array.from(registry.keys());

// Register plugins
register(GoogleTaskPlugin);
register(GmailReplyPlugin);
register(JiraPlugin);
register(CalendarReminderPlugin);

export default { register, get, getAll, getTypes };
