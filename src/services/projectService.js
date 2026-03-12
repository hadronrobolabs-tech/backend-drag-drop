/**
 * In-memory project store. Single responsibility: project CRUD.
 * Can be swapped for DB without changing controllers (Dependency Inversion).
 */
const projects = new Map();
let projectIdCounter = 1;

function nextId() {
  return 'proj-' + projectIdCounter++;
}

export function listProjects() {
  return Array.from(projects.values());
}

export function getProjectById(id) {
  return projects.get(id) ?? null;
}

export function createProject({ name = 'Untitled', kitId = 'arduino-uno', blocklyXml = '' } = {}) {
  const id = nextId();
  const project = {
    id,
    name,
    kitId,
    blocklyXml,
    version: 1,
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  projects.set(id, project);
  return project;
}

export function updateProject(id, updates) {
  const p = projects.get(id);
  if (!p) return null;
  if (updates.name !== undefined) p.name = updates.name;
  if (updates.kitId !== undefined) p.kitId = updates.kitId;
  if (updates.blocklyXml !== undefined) p.blocklyXml = updates.blocklyXml;
  p.updatedAt = new Date();
  return p;
}

export function deleteProject(id) {
  return projects.delete(id);
}
