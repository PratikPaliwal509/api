const projectService = require('../services/project.service');
const { successResponse } = require('../utils/response');

// ---------------- CREATE PROJECT ----------------
exports.createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(
      req.body,
      req.user.user_id,
      req.user.agency_id
    );
    return successResponse(res, 'PROJECT_CREATED', project, 201);
  } catch (err) {
    next(err);
  }
};

// ---------------- LIST PROJECTS ----------------
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getProjects(
      req.user.user_id,
      req.user.agency_id
    );
    return successResponse(res, 'PROJECTS_FETCHED', projects);
  } catch (err) {
    next(err);
  }
};

// ---------------- PROJECT DETAILS ----------------
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(
      Number(req.params.id),
      req.user.user_id,
      req.user.agency_id
    );
    return successResponse(res, 'PROJECT_FETCHED', project);
  } catch (err) {
    next(err);
  }
};

// ---------------- UPDATE PROJECT ----------------
exports.updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(
      Number(req.params.id),
      req.body,
      req.user.user_id
    );
    return successResponse(res, 'PROJECT_UPDATED', project);
  } catch (err) {
    next(err);
  }
};

// ---------------- ADD MEMBER ----------------
exports.addProjectMember = async (req, res, next) => {
  try {
    const project = await projectService.addProjectMember(
      Number(req.params.id),
      Number(req.body.user_id),
      req.user.user_id,
      req.user.agency_id // ✅ CORRECT
    );

    return successResponse(res, 'PROJECT_MEMBER_ADDED', project);
  } catch (err) {
    next(err);
  }
};

exports.updateProjectStatus = async (req, res) => {
  const projectId = parseInt(req.params.id)
  const { status } = req.body
  const userId = req.user?.id  // assuming your auth sets req.user

  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' })
  }

  try {
    const updatedProject = await projectService.updateProjectStatus(projectId, status, userId)
    res.json({
      success: true,
      message: 'Project status updated successfully',
      data: updatedProject,
    })
  } catch (error) {
    console.error('Project status update error:', error)
    res.status(500).json({ success: false, message: error.message || 'Failed to update status' })
  }
}

// ---------------- REMOVE MEMBER ----------------
exports.removeProjectMember = async (req, res, next) => {
  try {
    await projectService.removeProjectMember(
      Number(req.params.id),
      Number(req.params.userId),
      req.user.user_id
    );
    return successResponse(res, 'PROJECT_MEMBER_REMOVED');
  } catch (err) {
    next(err);
  }
};
