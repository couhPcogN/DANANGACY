import fs from 'node:fs';
import path from 'node:path';

const flags = process.argv.slice(2).filter((arg) => arg.startsWith('--'));
const clicks = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const outputName = flags.find((arg) => arg.startsWith('--out='))?.slice(6) ?? 'app-smoke.png';
const width = Number(flags.find((arg) => arg.startsWith('--width='))?.slice(8) ?? '390');
const height = Number(flags.find((arg) => arg.startsWith('--height='))?.slice(9) ?? '844');
const base = 'http://127.0.0.1:9222';
const pages = await (await fetch(`${base}/json`)).json();
const page = pages.find((item) => item.type === 'page' && item.url.includes('8765'));
if (!page) throw new Error('Chrome page for Expo Web not found');
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let serial = 0;
const pending = new Map();
const errors = [];
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
  }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text + ' ' + (message.params.exceptionDetails.exception?.description ?? ''));
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push(message.params.entry.text);
};
function call(method, params = {}) {
  const id = ++serial;
  return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
await call('Runtime.enable');
await call('Log.enable');
await call('Page.enable');
await call('Log.clear');
errors.length = 0;
await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
if (!flags.includes('--keep-storage')) await call('Runtime.evaluate', { expression: 'localStorage.clear()' });
await call('Page.reload', { ignoreCache: true });
await sleep(2500);
for (const click of clicks) {
  const expression = `(() => { const list = Array.from(document.querySelectorAll('button,[role="button"],[role="tab"]')); const target = list.find(x => x.innerText?.trim() === ${JSON.stringify(click)}) ?? list.find(x => x.innerText?.includes(${JSON.stringify(click)})); if (!target) return 'missing: ${click}'; target.click(); return 'clicked: ${click}'; })()`;
  const result = await call('Runtime.evaluate', { expression, returnByValue: true });
  console.log(result.result.value);
  if (String(result.result.value).startsWith('missing:')) process.exitCode = 1;
  await sleep(400);
}
const body = await call('Runtime.evaluate', { expression: 'document.body.innerText', returnByValue: true });
console.log('TEXT:', String(body.result.value).slice(0, 1400));
console.log('ERRORS:', JSON.stringify(errors));
const output = path.resolve('design/comparisons', outputName);
fs.mkdirSync(path.dirname(output), { recursive: true });
const screenshot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.writeFileSync(output, Buffer.from(screenshot.data, 'base64'));
console.log('SCREENSHOT:', output);
socket.close();
if (errors.length) process.exitCode = 1;
