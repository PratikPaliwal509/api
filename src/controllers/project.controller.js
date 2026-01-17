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
    console.log(req.body.hourly_rate)
    console.log(req.body.role_in_project)
    console.log(req.body.role)
    const project = await projectService.addProjectMember(
      Number(req.params.id),
      Number(req.body.user_id),
      req.user.user_id,
      req.user.agency_id, // ✅ CORRECT
      req.body.role_in_project,
      req.body.hourly_rate,
    );
console.log("project"+JSON.stringify(project))
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

    if (!projectId) {
      return res.status(400).json({ message: "Invalid project id" });
    }

    const users = await projectService.getAvailableUsersForProject(
      projectId,
      loggedInUserId
    );

    return res.status(200).json(users);
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
    console.log(req.user)
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
