/**
 * Project controller: CRUD. Delegates to ProjectService.
 */
import * as projectService from '../services/projectService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const list = projectService.listProjects();
  res.json({ success: true, data: { total: list.length, projects: list } });
});

export const getById = asyncHandler(async (req, res) => {
  const p = projectService.getProjectById(req.params.id);
  if (!p) {
    return res.status(404).json({ success: false, error: { message: 'Project not found' } });
  }
  res.json({ success: true, data: p });
});

export const create = asyncHandler(async (req, res) => {
  const { name, kitId, blocklyXml } = req.body || {};
  const project = projectService.createProject({
    name: name || 'Untitled',
    kitId: kitId || 'arduino-uno',
    blocklyXml: blocklyXml || '',
  });
  res.status(201).json({ success: true, data: project });
});

export const update = asyncHandler(async (req, res) => {
  const p = projectService.updateProject(req.params.id, req.body || {});
  if (!p) {
    return res.status(404).json({ success: false, error: { message: 'Project not found' } });
  }
  res.json({ success: true, data: p });
});

export const remove = asyncHandler(async (req, res) => {
  const deleted = projectService.deleteProject(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: { message: 'Project not found' } });
  }
  res.json({ success: true, data: null });
});
