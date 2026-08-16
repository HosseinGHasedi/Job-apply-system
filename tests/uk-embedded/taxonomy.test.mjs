import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S03 taxonomy');

const { loadTaxonomy, relevance, isEquivalent, resolveTech } = await import(
  pathToFileURL(join(ROOT, 'uk-embedded/taxonomy.mjs')).href
);

const tax = loadTaxonomy();

if (tax.roles.byId.has('embedded-linux') && tax.roles.byId.has('iot')) {
  pass('role taxonomy loads');
} else {
  fail('role taxonomy missing embedded-linux or iot');
}

if (tax.technologies.byId.has('mqtt') && tax.technologies.byId.has('yocto')) {
  pass('technology taxonomy loads');
} else {
  fail('technology taxonomy missing mqtt or yocto');
}

if (resolveTech(tax, 'mosquitto') === 'mqtt' && resolveTech(tax, 'Yocto Project') === 'yocto') {
  pass('synonyms resolve (mosquitto→mqtt, Yocto Project→yocto)');
} else {
  fail('synonyms failed');
}

const mqttIot = relevance(tax, 'mqtt', 'iot');
if (mqttIot.relevant && mqttIot.strength === 'strong' && mqttIot.equivalent === false) {
  pass('MQTT → strong IoT relevance');
} else {
  fail(`MQTT→IoT ${JSON.stringify(mqttIot)}`);
}

if (!isEquivalent(tax, 'mqtt', 'zigbee') && !relevance(tax, 'mqtt', 'zigbee').equivalent) {
  pass('MQTT → NOT equivalent to Zigbee');
} else {
  fail('MQTT incorrectly equivalent to Zigbee');
}

const yoctoLinux = relevance(tax, 'yocto', 'embedded-linux');
if (yoctoLinux.relevant && !yoctoLinux.equivalent) {
  pass('Yocto → Embedded Linux relevance');
} else {
  fail(`Yocto→Embedded Linux ${JSON.stringify(yoctoLinux)}`);
}

if (!isEquivalent(tax, 'yocto', 'buildroot')) {
  pass('Yocto → NOT equivalent to Buildroot');
} else {
  fail('Yocto incorrectly equivalent to Buildroot');
}

const reverse = relevance(tax, 'embedded-linux', 'yocto');
if (!reverse.relevant) {
  pass('relationships are directional (Embedded Linux ↛ Yocto)');
} else {
  fail('relationship was treated as bidirectional');
}
