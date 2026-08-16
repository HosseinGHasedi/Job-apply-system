import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S09 transferability');

const { loadTaxonomy, isEquivalent } = await import(pathToFileURL(join(ROOT, 'uk-embedded/taxonomy.mjs')).href);
const { transferability } = await import(pathToFileURL(join(ROOT, 'uk-embedded/transferability.mjs')).href);

const tax = loadTaxonomy();
const linuxEl = transferability('linux', 'embedded-linux', tax);
if (linuxEl.transferable && !linuxEl.equivalent) {
  pass('Linux → Embedded Linux = transferable');
} else {
  fail(`linux→embedded-linux ${JSON.stringify(linuxEl)}`);
}

const pyC = transferability('python', 'embedded-c', tax);
if (!pyC.equivalent && !pyC.transferable) {
  pass('Python → Embedded C = not equivalent');
} else {
  fail(`python→c ${JSON.stringify(pyC)}`);
}

const iotMqtt = transferability('iot', 'mqtt', tax);
if (iotMqtt.transferable) {
  pass('IoT → MQTT = relevant');
} else {
  fail(`mqtt→iot ${JSON.stringify(iotMqtt)}`);
}

if (!isEquivalent(tax, 'iot', 'autosar') && !transferability('iot', 'autosar', tax).transferable) {
  pass('IoT → AUTOSAR = unrelated');
} else {
  fail('IoT treated as AUTOSAR');
}
