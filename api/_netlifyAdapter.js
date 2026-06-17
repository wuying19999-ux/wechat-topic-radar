function getRequestUrl(req) {
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";

  return `${protocol}://${host}${req.url}`;
}

function getRequestHeaders(headers = {}) {
  const nextHeaders = new Headers();

  Object.entries(headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => nextHeaders.append(key, item));
      return;
    }

    if (value !== undefined) {
      nextHeaders.set(key, value);
    }
  });

  return nextHeaders;
}

async function getRequestBody(req) {
  if (req.method === "GET" || req.method === "HEAD") {
    return undefined;
  }

  if (typeof req.body === "string") {
    return req.body;
  }

  if (Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (req.body && typeof req.body === "object") {
    return JSON.stringify(req.body);
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  return chunks.length ? Buffer.concat(chunks) : undefined;
}

function exposeNetlifyEnv() {
  globalThis.Netlify = {
    env: {
      get(key) {
        return process.env[key];
      },
    },
  };
}

export async function runWebHandler(handler, req, res) {
  exposeNetlifyEnv();

  const request = new Request(getRequestUrl(req), {
    method: req.method,
    headers: getRequestHeaders(req.headers),
    body: await getRequestBody(req),
  });
  const response = await handler(request);
  const body = Buffer.from(await response.arrayBuffer());

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "content-encoding") {
      res.setHeader(key, value);
    }
  });

  res.status(response.status).send(body);
}
