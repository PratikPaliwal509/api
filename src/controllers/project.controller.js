const { use } = require('react');
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
    const projects = await projectService.getProjectsByScope(
      req.user
      // req.user.user_id,
      // req.user.agency_id
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
      req.user.agency.agency_id
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
    const {
      user_id,
      role_in_project,
      hourly_rate,
      is_active = true
    } = req.body;

    const projectAssignPermission =
      req.user?.role?.permissions?.projects?.view === "all" ||
      req.user?.role?.permissions?.projects?.view === "agency" ||
      req.user?.role?.permissions?.projects?.view === "department" ;

    const projectMember = await projectService.addProjectMember(
      Number(req.params.id),     // projectId
      Number(user_id),           // userId
      req.user.user_id,          // addedBy
      req.user.role?.name,       // role (optional, if used)
      role_in_project,
      hourly_rate,
      is_active,
      req.user.agency_id,
      projectAssignPermission
    );

    return successResponse(
      res,
      'PROJECT_MEMBER_ADDED',
      projectMember
    );
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


exports.getManagedProjects = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const projects = await projectService.getProjectsManagedByUser(userId);

    return res.status(200).json(projects);
  } catch (error) {
    console.error("Controller Error:", error);
    return res.status(500).json({
      message: "Failed to fetch managed projects",
    });
  }
};

exports.getProjectUsers = async (req, res) => {
  try {
    const projectId = Number(req.params.project_id);
    const loggedInUserId = req.user.user_id;
    const permissions = req.user?.role?.permissions;
    if (!projectId) {
      return res.status(400).json({ message: "Invalid project id" });
    }
    /* ---------- Permission Check ---------- */
    const projectViewPermission = permissions?.projects?.view;
    if (!projectViewPermission) {
      return res.status(403).json({
        message: "You do not have permission to view projects",
      });
    }

    // Allowed: true | "all" | "agency"
    if (
      projectViewPermission !== true &&
      projectViewPermission !== "all" &&
      projectViewPermission !== "department" &&
      projectViewPermission !== "team" &&
      projectViewPermission !== "assigned" &&
      projectViewPermission !== "agency" 
    ) {
      return res.status(403).json({
        message: "You do not have permission to view this project",
      });
    }

    /* ---------- Fetch Users ---------- */
    const users = await projectService.getAvailableUsersForProject(
      projectId,
      loggedInUserId,
      // projectViewPermission // pass scope if needed
    );

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Controller Error:", error);

    if (error.message === "NOT_PROJECT_MANAGER") {
      return res.status(403).json({
        message: "You are not allowed to access this project",
      });
    }

    return res.status(500).json({
      message: "Failed to fetch project users",
    });
  }
};


exports.getProjectNotes = async (req, res) => {
  try {
    const notes = await projectService.fetchProjectNotesService(req.user)
    res.status(200).json(notes)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to fetch project notes" })
  }
}

exports.addProjectNote = async (req, res) => {
  try {
    const { project_id, title, notes } = req.body
    const userId = req.user.user_id

    if (!title || !notes) {
      return res.status(400).json({ success: false, message: "Title and notes are required" })
    }

    const updatedProject = await projectService.addProjectNoteService({ project_id, title, notes, userId })

    res.json({ success: true, data: updatedProject, message: "Note added to project successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: err.message || "Something went wrong" })
  }
}

exports.getProjectsWithoutNotes = async (req, res) => {
  try {
    const agency_id = req.user.agency.agency_id // from auth middleware
    const projects = await projectService.getProjectsWithoutNotesService(agency_id)

    return res.status(200).json({
      success: true,
      data: projects,
    })
  } catch (error) {
    console.error("Get projects without notes error:", error)

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects without notes",
    })
  }
}

exports.leaveProjectController = async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    // Optional: only allow self-leave
    if (Number(userId) !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: 'You can only leave the project yourself',
      });
    }

    const result = await projectService.leaveProject(projectId, userId);

    res.json({
      success: true,
      message: 'You have left the project successfully',
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};