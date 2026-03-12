/**
 * Kit data service. Single source of truth for kits (could be replaced by DB later).
 */
const KITS = [
  {
    id: 'arduino-uno',
    name: 'Arduino UNO',
    description: 'Classic Arduino',
    version: '1',
    manufacturer: 'Arduino',
    boardType: 'arduino',
    pinMappings: [],
    supportedBlocks: ['led_on', 'led_off', 'delay_ms'],
    firmwareTemplate: '',
    libraries: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'arduino-nano',
    name: 'Arduino Nano',
    description: 'Compact Arduino',
    version: '1',
    manufacturer: 'Arduino',
    boardType: 'arduino',
    pinMappings: [],
    supportedBlocks: ['led_on', 'led_off', 'delay_ms'],
    firmwareTemplate: '',
    libraries: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function getAllKits() {
  return KITS;
}

export function getKitById(id) {
  return KITS.find((k) => k.id === id) ?? null;
}
