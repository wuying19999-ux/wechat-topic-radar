const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function normalizeBody(body = {}) {
  return {
    id: body.id || crypto.randomUUID(),
    school: String(body.school || "").trim(),
    country: String(body.country || "").trim(),
    module_id: String(body.moduleId || "").trim(),
    module_name: String(body.moduleName || "").trim(),
    dialogue_key: String(body.dialogueKey || "").trim(),
    title: String(body.title || "").trim(),
    copy_text: String(body.copyText || "").slice(0, 5000),
    effect: String(body.effect || "未选择").trim(),
    posted_group_name: String(body.postedGroupName || "").trim(),
    operator_name: String(body.operatorName || "").trim(),
  };
}

export const config = {
  maxDuration: 15,
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!hasSupabaseConfig()) {
    res.status(200).json({ storage: "memory", skipped: true });
    return;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/published_topics`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(normalizeBody(req.body)),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    res.status(201).json({ record: (await response.json())[0], storage: "supabase" });
  } catch (error) {
    res.status(502).json({ error: "已发布话题保存失败", detail: error.message });
  }
}
