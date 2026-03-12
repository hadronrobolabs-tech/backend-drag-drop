/**
 * Single responsibility: Blockly XML → Arduino C++ code only.
 * Open for extension: add new block types here without changing callers.
 */

function getField(inner, name) {
  const re = new RegExp(`<field name="${name}"[^>]*>([^<]+)</field>`);
  const m = inner.match(re);
  return m ? m[1].trim() : null;
}

/** Get inner XML of first complete block inside <statement name="..."> (handles nested statement tags) */
function getStatement(inner, name) {
  const openTag = `<statement name="${name}"`;
  const start = inner.indexOf(openTag);
  if (start === -1) return null;
  const afterOpen = inner.indexOf('>', start) + 1;
  const blockStart = inner.indexOf('<block', afterOpen);
  if (blockStart === -1) return null;
  const end = findBlockEnd(inner, blockStart);
  if (end === -1) return null;
  return inner.slice(blockStart, end).trim();
}

/** Find matching </value> for <value at start (by depth count) */
function findValueEnd(inner, valueStart) {
  let depth = 1;
  let i = inner.indexOf('>', valueStart) + 1;
  while (i < inner.length && depth > 0) {
    const nextOpen = inner.indexOf('<value', i);
    const nextClose = inner.indexOf('</value>', i);
    if (nextClose === -1) return -1;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = inner.indexOf('>', nextOpen) + 1;
    } else {
      depth--;
      if (depth === 0) return nextClose;
      i = nextClose + 8;
    }
  }
  return -1;
}

function getValueNameFromTag(inner, tagStart) {
  const nameStart = inner.indexOf('name="', tagStart) + 6;
  if (nameStart < 6) return null;
  const nameEnd = inner.indexOf('"', nameStart);
  return nameEnd === -1 ? null : inner.slice(nameStart, nameEnd);
}

/** Get inner XML of first complete block inside <value name="...">. Uses top-level value tags so nested A/B don't clash. */
function getValue(inner, name) {
  let pos = 0;
  while (pos < inner.length) {
    const valueStart = inner.indexOf('<value ', pos);
    if (valueStart === -1) return null;
    const valueName = getValueNameFromTag(inner, valueStart);
    const afterOpen = inner.indexOf('>', valueStart) + 1;
    const valueEnd = findValueEnd(inner, valueStart);
    if (valueEnd === -1) { pos = afterOpen; continue; }
    if (valueName === name) {
      const content = inner.slice(afterOpen, valueEnd);
      const blockStart = content.indexOf('<block');
      if (blockStart === -1) return null;
      const end = findBlockEnd(content, blockStart);
      if (end === -1) return null;
      return content.slice(blockStart, end).trim();
    }
    pos = valueEnd + 8;
  }
  return null;
}

/**
 * Find the end index of the current <block>...</block> (handles nested blocks).
 */
function findBlockEnd(xml, start) {
  let depth = 0;
  let i = start;
  const len = xml.length;
  while (i < len) {
    const open = xml.indexOf('<block', i);
    const close = xml.indexOf('</block>', i);
    if (close === -1) break;
    if (open !== -1 && open < close) {
      depth++;
      i = open + 6;
      continue;
    }
    depth--;
    if (depth === 0) return close + 8; // length of '</block>'
    i = close + 8;
  }
  return -1;
}

function getFirstBlockXml(xml) {
  const s = (xml || '').trim();
  const start = s.indexOf('<block');
  if (start === -1) return null;
  const end = findBlockEnd(s, start);
  if (end === -1) return null;
  return s.slice(start, end);
}

function getAllBlocks(xml) {
  const blocks = [];
  let pos = 0;
  const s = xml.replace(/^[\s\S]*?<xml[^>]*>/i, '').replace(/<\/xml>[\s\S]*$/i, '');
  while (true) {
    const start = s.indexOf('<block', pos);
    if (start === -1) break;
    const end = findBlockEnd(s, start);
    if (end === -1) break;
    const blockStr = s.slice(start, end);
    const typeMatch = blockStr.match(/type="([^"]+)"/);
    const type = typeMatch ? typeMatch[1] : '';
    const innerStart = blockStr.indexOf('>', blockStr.indexOf('type=')) + 1;
    const inner = blockStr.slice(innerStart, blockStr.length - 8); // strip </block>
    blocks.push({ type, inner });
    pos = end;
  }
  return blocks;
}

/** Map Blockly compare OP to Arduino operator */
const COMPARE_OP = { EQ: '==', NEQ: '!=', LT: '<', LTE: '<=', GT: '>', GTE: '>=' };

/**
 * Convert a value block (expression) to Arduino C++ expression string.
 * @param {string} valueXml - Inner XML of a <value> (single block)
 * @returns {string} Arduino expression, e.g. "digitalRead(2)", "true", "(a && b)"
 */
function valueToArduino(valueXml) {
  const blockStr = getFirstBlockXml(valueXml);
  if (!blockStr) return 'true';
  const typeMatch = blockStr.match(/type="([^"]+)"/);
  const type = typeMatch ? typeMatch[1] : '';
  const innerStart = blockStr.indexOf('>', blockStr.indexOf('type=')) + 1;
  const inner = blockStr.slice(innerStart, blockStr.length - 8);

  if (type === 'logic_boolean') {
    const v = getField(inner, 'BOOL');
    return v === 'TRUE' ? 'HIGH' : 'LOW';
  }
  if (type === 'math_number') {
    const n = getField(inner, 'NUM');
    return n != null ? String(n) : '0';
  }
  if (type === 'digital_read') {
    const pin = getField(inner, 'PIN') || '2';
    return `digitalRead(${pin})`;
  }
  if (type === 'analog_read') {
    const pin = getField(inner, 'PIN') || 'A0';
    return `analogRead(${pin})`;
  }
  if (type === 'logic_compare') {
    const op = getField(inner, 'OP') || 'EQ';
    const aXml = getValue(inner, 'A');
    const bXml = getValue(inner, 'B');
    const a = valueToArduino(aXml);
    const b = valueToArduino(bXml);
    const opStr = COMPARE_OP[op] || '==';
    return `(${a} ${opStr} ${b})`;
  }
  if (type === 'logic_operation') {
    const op = getField(inner, 'OP') || 'AND';
    const aXml = getValue(inner, 'A');
    const bXml = getValue(inner, 'B');
    const a = valueToArduino(aXml);
    const b = valueToArduino(bXml);
    return op === 'OR' ? `(${a} || ${b})` : `(${a} && ${b})`;
  }
  if (type === 'logic_negate') {
    const boolXml = getValue(inner, 'BOOL');
    return `(!${valueToArduino(boolXml)})`;
  }
  if (type === 'math_arithmetic') {
    const op = getField(inner, 'OP') || 'ADD';
    const aXml = getValue(inner, 'A');
    const bXml = getValue(inner, 'B');
    const a = valueToArduino(aXml);
    const b = valueToArduino(bXml);
    const opMap = { ADD: '+', MINUS: '-', MULTIPLY: '*', DIVIDE: '/', POWER: '^' };
    const opStr = opMap[op] || '+';
    return opStr === '^' ? `((int)pow((double)${a}, (double)${b}))` : `(${a} ${opStr} ${b})`;
  }
  return 'true';
}

/**
 * Expand a custom block to Arduino lines. type = 'custom_<id>', inner = block content.
 * customBlocksMap: Map(id -> { template, inputs }).
 */
/** Normalize HIGH/LOW so user can type LOW, HIGH, %LOW, %HIGH and we output C constant */
function normalizeArduinoConstant(v) {
  if (v == null) return '0';
  const s = String(v).trim().toUpperCase().replace(/^%+/, '');
  if (s === 'HIGH') return 'HIGH';
  if (s === 'LOW') return 'LOW';
  return String(v).trim();
}

function expandCustomBlock(type, inner, customBlocksMap, indent) {
  if (!type.startsWith('custom_') || !customBlocksMap) return [];
  const id = type.slice(7);
  const def = customBlocksMap.get(id);
  if (!def || !def.template) return [];
  const values = [];
  const n = Math.max(1, (def.inputs && def.inputs.length) || 0);
  for (let i = 0; i < n; i++) {
    const fieldName = 'INPUT' + i;
    const v = getField(inner, fieldName);
    let val = v != null ? String(v).trim() : '0';
    // Second arg for digitalWrite: allow HIGH/LOW even if user typed %LOW or "LOW"
    if (n >= 2 && i === 1) val = normalizeArduinoConstant(val || v);
    values.push(val);
  }
  let code = def.template;
  values.forEach((v, i) => {
    code = code.split('%' + (i + 1)).join(v);
  });
  return code.split('\n').filter(Boolean).map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return indent + trimmed;
    const last = trimmed.slice(-1);
    // Ensure statement lines end with ; so delay(500) becomes delay(500);
    if (last !== ';' && last !== '{' && last !== '}' && !trimmed.endsWith('*/') && !trimmed.startsWith('//')) {
      return indent + trimmed + ';';
    }
    return indent + trimmed;
  });
}

function processOneBlock(blockStr, indent, customBlocksMap = null) {
  const typeMatch = blockStr.match(/type="([^"]+)"/);
  const type = typeMatch ? typeMatch[1] : '';
  const innerStart = blockStr.indexOf('>', blockStr.indexOf('type=')) + 1;
  const inner = blockStr.slice(innerStart, blockStr.length - 8);
  const out = [];
  if (type.startsWith('custom_') && customBlocksMap) {
    out.push(...expandCustomBlock(type, inner, customBlocksMap, indent));
  } else if (type === 'led_on') {
    const pin = getField(inner, 'PIN') || '13';
    out.push(indent + `digitalWrite(${pin}, HIGH);`);
  } else if (type === 'led_off') {
    const pin = getField(inner, 'PIN') || '13';
    out.push(indent + `digitalWrite(${pin}, LOW);`);
  } else if (type === 'delay_ms') {
    const ms = getField(inner, 'DURATION') || '500';
    out.push(indent + `delay(${ms});`);
  } else if (type === 'controls_whileUntil') {
    const doXml = getStatement(inner, 'DO');
    if (doXml) {
      out.push(indent + 'while (true) {');
      out.push(...collectStatements(doXml, indent + '  '));
      out.push(indent + '}');
    }
  } else if (type === 'controls_repeat_ext') {
    const times = getField(inner, 'TIMES') || '10';
    const doXml = getStatement(inner, 'DO');
    if (doXml) {
      out.push(indent + `for (int __i = 0; __i < ${times}; __i++) {`);
      out.push(...collectStatements(doXml, indent + '  '));
      out.push(indent + '}');
    }
  } else if (type === 'controls_if') {
    const if0Xml = getValue(inner, 'IF0');
    const cond = if0Xml ? valueToArduino(if0Xml) : 'true';
    const doXml = getStatement(inner, 'DO0');
    const elseXml = getStatement(inner, 'ELSE');
    if (doXml) {
      out.push(indent + `if (${cond}) {`);
      out.push(...collectStatements(doXml, indent + '  '));
      if (elseXml) {
        out.push(indent + '} else {');
        out.push(...collectStatements(elseXml, indent + '  '));
      }
      out.push(indent + '}');
    }
  }
  return { out, inner };
}

/**
 * Process a chain of blocks (block <next> block <next> ...). Outputs code for root, then recurses into <next>.
 */
function collectStatements(xml, indent, customBlocksMap = null) {
  const out = [];
  let s = (xml || '').trim();
  while (s.length > 0) {
    const start = s.indexOf('<block');
    if (start === -1) break;
    const end = findBlockEnd(s, start);
    if (end === -1) break;
    const blockStr = s.slice(start, end);
    const { out: lines, inner } = processOneBlock(blockStr, indent, customBlocksMap);
    out.push(...lines);
    const nextMatch = inner.match(/<next\s*>\s*<block/);
    if (nextMatch) {
      const nextBlockStart = inner.indexOf('<block', inner.indexOf('<next'));
      const nextEnd = findBlockEnd(inner, nextBlockStart);
      if (nextEnd !== -1) {
        s = inner.slice(nextBlockStart, nextEnd + 8);
        continue;
      }
    }
    break;
  }
  return out;
}

function buildCustomBlocksMap(customBlocksList) {
  const map = new Map();
  if (Array.isArray(customBlocksList)) {
    customBlocksList.forEach((b) => map.set(b.id, b));
  }
  return map;
}

/** Collect OUTPUT pins (led_on, led_off) from full XML */
function collectOutputPins(blockXml) {
  const set = new Set();
  const re = /<block[^>]*type="(led_on|led_off)"[^>]*>[\s\S]*?<field name="PIN"[^>]*>([^<]+)<\/field>/g;
  let m;
  while ((m = re.exec(blockXml)) !== null) set.add(m[2].trim());
  return set;
}

/** Collect INPUT pins (digital_read, analog_read) from full XML */
function collectInputPins(blockXml) {
  const set = new Set();
  const re = /<block[^>]*type="(digital_read|analog_read)"[^>]*>[\s\S]*?<field name="PIN"[^>]*>([^<]+)<\/field>/g;
  let m;
  while ((m = re.exec(blockXml)) !== null) set.add(m[2].trim());
  return set;
}

/**
 * Converts Blockly XML to Arduino C++ (setup + loop).
 * @param {string} blockXml - Blockly workspace XML
 * @param {Array} customBlocksList - Optional list of custom block defs (id, name, inputs, template)
 * @returns {string} Arduino C++ code
 */
export function xmlToArduino(blockXml, customBlocksList = null) {
  if (!blockXml || typeof blockXml !== 'string') return '';

  const customBlocksMap = buildCustomBlocksMap(customBlocksList);
  const blocks = getAllBlocks(blockXml);
  const outputPins = collectOutputPins(blockXml);
  const inputPins = collectInputPins(blockXml);
  const setup = [];
  outputPins.forEach((pin) => setup.push(`  pinMode(${pin}, OUTPUT);`));
  inputPins.forEach((pin) => setup.push(`  pinMode(${pin}, INPUT);`));
  const loop = [];

  for (const { type, inner } of blocks) {
    if (type === 'led_on') {
      loop.push(...collectStatements(`<block type="led_on">${inner}</block>`, '  ', customBlocksMap));
    } else if (type === 'led_off') {
      loop.push(...collectStatements(`<block type="led_off">${inner}</block>`, '  ', customBlocksMap));
    } else if (type === 'delay_ms') {
      loop.push(...collectStatements(`<block type="delay_ms">${inner}</block>`, '  ', customBlocksMap));
    } else if (type.startsWith('custom_') && customBlocksMap.size > 0) {
      loop.push(...expandCustomBlock(type, inner, customBlocksMap, '  '));
    } else if (type === 'controls_whileUntil') {
      const doXml = getStatement(inner, 'DO');
      if (doXml) {
        loop.push('  while (true) {');
        loop.push(...collectStatements(doXml, '    ', customBlocksMap));
        loop.push('  }');
      }
    } else if (type === 'controls_repeat_ext') {
      const doXml = getStatement(inner, 'DO');
      const times = getField(inner, 'TIMES') || '10';
      if (doXml) {
        loop.push(`  for (int __i = 0; __i < ${times}; __i++) {`);
        loop.push(...collectStatements(doXml, '    ', customBlocksMap));
        loop.push('  }');
      }
    } else if (type === 'controls_if') {
      const if0Xml = getValue(inner, 'IF0');
      const cond = if0Xml ? valueToArduino(if0Xml) : 'true';
      const doXml = getStatement(inner, 'DO0');
      const elseXml = getStatement(inner, 'ELSE');
      if (doXml) {
        loop.push(`  if (${cond}) {`);
        loop.push(...collectStatements(doXml, '    ', customBlocksMap));
        if (elseXml) {
          loop.push('  } else {');
          loop.push(...collectStatements(elseXml, '    ', customBlocksMap));
        }
        loop.push('  }');
      }
    }
  }

  const setupCode = setup.length ? setup.join('\n') : '  // setup';
  const loopCode = loop.length ? loop.join('\n') : '  // Add blocks in workspace';
  return `void setup() {
${setupCode}
}

void loop() {
${loopCode}
}
`;
}
