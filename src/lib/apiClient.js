export async function answerQuestion(payload) {
  const response = await fetch("/api/answer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "生成失败");
  }

  return response.json();
}

export async function generateGroupDialogue(payload) {
  const response = await fetch("/api/generate-dialogue", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "生成对话失败");
  }

  return response.json();
}

export async function fetchTrialRecords({ admin = false } = {}) {
  const response = await fetch(`/api/trial-records${admin ? "?admin=1" : ""}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "读取试运营数据失败");
  }

  return response.json();
}

export async function saveTrialRecord(payload) {
  const response = await fetch("/api/trial-records", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "保存试运营数据失败");
  }

  return response.json();
}

export async function generateAISafety(payload) {
  const response = await fetch("/api/ai-safety", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "AI 安全话术生成失败");
  }

  return response.json();
}

export async function fetchTestingBoard({ admin = false } = {}) {
  const response = await fetch(`/api/testing-board${admin ? "?admin=1" : ""}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "读取测试/Bug 看板失败");
  }

  return response.json();
}

export async function saveTestingBoardRecord(payload) {
  const response = await fetch("/api/testing-board", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "保存测试/Bug 记录失败");
  }

  return response.json();
}

export async function savePublishedTopic(payload) {
  const response = await fetch("/api/published-topics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "保存已发布话题失败");
  }

  return response.json();
}
