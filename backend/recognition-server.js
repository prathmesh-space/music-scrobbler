/* global process, Buffer */

import dotenv from 'dotenv';
import { createHmac } from 'node:crypto';
import { createServer } from 'node:http';

dotenv.config();

// ================= ENV CONFIG =================

const PORT = Number.parseInt(process.env.ACR_PROXY_PORT || '8787', 10);
const HOST = process.env.ACR_PROXY_HOST || '0.0.0.0';

const ACR_HOST = (process.env.ACR_HOST || '').trim();
const ACR_ACCESS_KEY = (process.env.ACR_ACCESS_KEY || '').trim();
const ACR_ACCESS_SECRET = (process.env.ACR_ACCESS_SECRET || '').trim();
const ACR_SCHEME =
  (process.env.ACR_SCHEME || 'https').trim().toLowerCase() === 'http'
    ? 'http'
    : 'https';

const ACR_PATH = '/v1/identify';

// ================= HELPERS =================

const readBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

const getCorsHeaders = () => ({
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST,OPTIONS',
  'access-control-allow-headers': 'content-type,x-sample-bytes,x-sample-filename',
});

const parseMultipartPayload = (buffer, contentType) => {
  const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
  if (!boundaryMatch) {
    throw new Error('Multipart payload is missing boundary.');
  }

  const boundary = boundaryMatch[1].replace(/^"|"$/g, '');
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const parts = [];
  let cursor = 0;

  while (cursor < buffer.length) {
    const start = buffer.indexOf(boundaryBuffer, cursor);
    if (start < 0) {
      break;
    }

    const partStart = start + boundaryBuffer.length;
    if (buffer[partStart] === 45 && buffer[partStart + 1] === 45) {
      break;
    }

    let contentStart = partStart;
    if (buffer[contentStart] === 13 && buffer[contentStart + 1] === 10) {
      contentStart += 2;
    }

    const nextBoundary = buffer.indexOf(boundaryBuffer, contentStart);
    if (nextBoundary < 0) {
      break;
    }

    let part = buffer.slice(contentStart, nextBoundary);
    if (part[part.length - 2] === 13 && part[part.length - 1] === 10) {
      part = part.slice(0, -2);
    }

    parts.push(part);
    cursor = nextBoundary;
  }

  let sampleBuffer = null;
  let sampleBytes = null;
  let filename = 'sample.wav';
  let mimeType = 'application/octet-stream';

  for (const part of parts) {
    const separator = part.indexOf(Buffer.from('\r\n\r\n'));
    if (separator < 0) {
      continue;
    }

    const headersRaw = part.slice(0, separator).toString('utf8');
    const value = part.slice(separator + 4);

    const nameMatch = headersRaw.match(/name="([^"]+)"/i);
    const fieldName = nameMatch?.[1];

    if (fieldName === 'sample') {
      sampleBuffer = value;
      const filenameMatch = headersRaw.match(/filename="([^"]+)"/i);
      filename = filenameMatch?.[1] || filename;

      const mimeMatch = headersRaw.match(/content-type:\s*([^\r\n]+)/i);
      mimeType = mimeMatch?.[1]?.trim() || mimeType;
    }

    if (fieldName === 'sample_bytes') {
      const parsed = Number.parseInt(value.toString('utf8').trim(), 10);
      if (Number.isFinite(parsed)) {
        sampleBytes = parsed;
      }
    }
  }

  if (!sampleBuffer || sampleBuffer.length === 0) {
    throw new Error('Multipart payload did not include a valid sample file.');
  }

  return {
    sampleBuffer,
    sampleBytes: sampleBytes ?? sampleBuffer.length,
    filename,
    mimeType,
  };
};

const normalizeAcrPayload = async (request) => {
  const contentType = request.headers['content-type'] || '';

  // AUDIO BINARY
  if (
    contentType.includes('application/octet-stream') ||
    contentType.startsWith('audio/')
  ) {
    const sampleBuffer = await readBody(request);

    const sampleBytesHeader = Number.parseInt(
      request.headers['x-sample-bytes'] || `${sampleBuffer.length}`,
      10
    );

    return {
      sampleBuffer,
      sampleBytes: Number.isFinite(sampleBytesHeader)
        ? sampleBytesHeader
        : sampleBuffer.length,
      filename: request.headers['x-sample-filename'] || 'sample.wav',
      mimeType: contentType,
    };
  }

  if (contentType.includes('multipart/form-data')) {
    const body = await readBody(request);
    return parseMultipartPayload(body, contentType);
  }

  throw new Error(`Unsupported content type: ${contentType || 'none'}`);
};

const createAcrSignature = ({ accessKey, accessSecret, timestamp }) => {
  const signatureVersion = '1';
  const dataType = 'audio';

  const stringToSign = [
    'POST',
    ACR_PATH,
    accessKey,
    dataType,
    signatureVersion,
    timestamp,
  ].join('\n');

  const signature = createHmac('sha1', accessSecret)
    .update(stringToSign)
    .digest('base64');

  return { signature, signatureVersion, dataType };
};

const recognizeSong = async ({
  sampleBuffer,
  sampleBytes,
  filename,
  mimeType,
}) => {
  const timestamp = `${Math.floor(Date.now() / 1000)}`;

  const { signature, signatureVersion, dataType } = createAcrSignature({
    accessKey: ACR_ACCESS_KEY,
    accessSecret: ACR_ACCESS_SECRET,
    timestamp,
  });

  const outgoingForm = new FormData();
  outgoingForm.append('access_key', ACR_ACCESS_KEY);
  outgoingForm.append('sample_bytes', `${sampleBytes}`);
  outgoingForm.append(
    'sample',
    new Blob([sampleBuffer], { type: mimeType }),
    filename
  );
  outgoingForm.append('timestamp', timestamp);
  outgoingForm.append('signature', signature);
  outgoingForm.append('data_type', dataType);
  outgoingForm.append('signature_version', signatureVersion);

  const url = `${ACR_SCHEME}://${ACR_HOST}${ACR_PATH}`;

  const response = await fetch(url, {
    method: 'POST',
    body: outgoingForm,
  });

  const text = await response.text();

  let payload = text;
  try {
    payload = JSON.parse(text);
  } catch {
    // not JSON
  }

  return {
    statusCode: response.status,
    payload,
  };
};

const assertConfig = () => {
  if (!ACR_HOST || !ACR_ACCESS_KEY || !ACR_ACCESS_SECRET) {
    throw new Error(
      'Missing env vars: ACR_HOST, ACR_ACCESS_KEY, ACR_ACCESS_SECRET'
    );
  }
};

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'content-type': 'application/json',
    ...getCorsHeaders(),
  });
  response.end(JSON.stringify(payload));
};

// ================= SERVER =================

try {
  assertConfig();
} catch (error) {
  console.error('❌ Config Error:', error.message);
  process.exit(1);
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, getCorsHeaders());
    response.end();
    return;
  }

  if (request.method !== 'POST' || request.url !== '/acr/recognize') {
    sendJson(response, 404, { error: 'Not found' });
    return;
  }

  try {
    const normalized = await normalizeAcrPayload(request);
    const { statusCode, payload } = await recognizeSong(normalized);
    sendJson(response, statusCode, payload);
  } catch (error) {
    console.error('Recognition error:', error);
    sendJson(response, 400, {
      error: error.message || 'Recognition proxy request failed.',
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(
    `🚀 ACR proxy listening on http://${HOST}:${PORT}/acr/recognize`
  );
});
