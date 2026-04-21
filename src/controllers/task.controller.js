const taskService = require('../services/task.service');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * POST /tasks
 */
const createTask = async (req, res) => {
  try {
    const task = await taskService.createTask(req.body, req.user.user_id);
    return successResponse(res, 'Task created successfully', task, 201);
  } catch (err) {
     console.log(err)
    return errorResponse(res, err.message);
  }
};

/**
 * GET /tasks
 */
const getTasks = async (req, res) => {
  try {
    const tasks = await taskService.getTasks(req.user);
    return successResponse(res, 'Task list fetched', tasks);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};


/**
 * GET /tasks/:id
 */
const getTaskById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(Number(req.params.id));
    if (!task) {
      return errorResponse(res, 'Task not found', 404);
    }
    return successResponse(res, 'Task details fetched', task);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

/**
 * PUT /tasks/:id
 */
const updateTask = async (req, res) => {
  try {
    const task = await taskService.updateTask(
      Number(req.params.id),
      req.body
    );
    return successResponse(res, 'Task updated successfully', task);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

/**
 * POST /tasks/:id/assign
 */
const assignUsers = async (req, res) => {
  try {
    const { user_ids } = req.body;

    await taskService.assignUsers(
      Number(req.params.id),
      user_ids,
      req.user.user_id
    );

    return successResponse(res, 'Users assigned to task');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

/**
 * PATCH /tasks/:id/status
 */
const changeStatus = async (req, res) => {
  try {
    const task = await taskService.changeStatus(
      Number(req.params.id),
      req.body.status
    );
    return successResponse(res, 'Task status updated', task);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};


/**
 * POST /tasks/:taskId/subtasks
 */
const createSubtask = async (req, res) => {
  try {
    const parentTaskId = Number(req.params.taskId);

    const subtask = await taskService.createTask(
      {
        ...req.body,
        parent_task_id: parentTaskId
      },
      req.user.user_id
    );

    return successResponse(res, 'Subtask created successfully', subtask, 201);
  } catch (err) {
   
    return errorResponse(res, err.message);
  }
};

/**
 * GET /tasks/:taskId/subtasks
 */
const getSubtasks = async (req, res) => {
  try {
    const subtasks = await taskService.getSubtasksByTaskId(
      Number(req.params.taskId)
    );

    return successResponse(res, 'Subtasks fetched', subtasks);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const addTaskChecklist = async (req, res) => {
  try {
    const { taskId } = req.params
    const { checklist } = req.body

    if (!Array.isArray(checklist)) {
      return res.status(400).json({
        message: 'Checklist must be an array'
      })
    }

    const task = await taskService.addChecklistToTask(Number(taskId), checklist)

    res.status(200).json({
      message: 'Checklist added successfully',
      data: task
    })
  } catch (error) {
    res.status(500).json({
      message: 'Failed to add checklist'
    })
  }
}

const removeAssignment = async (req, res) => {
  try {
    const { taskId, userId } = req.params
    const result = await taskService.removeTaskAssignment({
      task_id: Number(taskId),
      user_id: Number(userId),
      removed_by: req.user.user_id,
      user_role: req.user.role, // 👈 role from JWT
    })

    res.json({
      success: true,
      message: 'Task assignment removed',
      data: result,
    })
  } catch (error) {
    res.status(403).json({
      success: false,
      message: error.message,
    })
  }
}

const getTasksOverview = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    const { startDate, endDate } = req.query;

    const overview = await taskService.getTasksOverview(
      userId,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
};

// controllers/task.controller.js
const getProjectTasks = async (req, res) => {
  try {
    // const { projectId } = req.params
    const projectId = req.params.id
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required',
      })
    }

    const tasks = await taskService.getProjectTasks(projectId)

    return res.status(200).json({
      success: true,
      data: tasks,
      count: tasks.length,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch project tasks',
    })
  }
}
const approveTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const userId = req.user.user_id // from auth middleware

    const task = await taskService.approveTaskByClient(taskId, userId)

    return successResponse(
      res,
      'Task approved successfully',
      task,
      200
    )
  } catch (error) {
    return errorResponse(res, error.message)
  }
}


/**
 * PATCH /tasks/:id/priority
 */
const changePriority = async (req, res) => {
  try {
    const task = await taskService.changePriority(
      Number(req.params.id),
      req.body.priority
    )

    return successResponse(res, 'Task priority updated', task)
  } catch (err) {
    return errorResponse(res, err.message)
  }
}

/**
 * PATCH /tasks/:id/type
 */
const changeTaskType = async (req, res) => {
  try {
    const task = await taskService.changeTaskType(
      Number(req.params.id),
      req.body.task_type
    )

    return successResponse(res, 'Task type updated', task)
  } catch (err) {
    return errorResponse(res, err.message)
  }
}

const changeTaskTags = async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const { tags } = req.body;

    const updatedTask = await taskService.updateTaskTags(taskId, tags);

    return res.status(200).json({
      success: true,
      message: 'Task tags updated successfully',
      data: updatedTask
    });
  } catch (error) {
    console.error('changeTaskTags error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update task tags'
    });
  }
}

const deleteTask = async (req, res) => {
  try {
    console.log("start")
    const taskId = Number(req.params.id);
    const userId = req.user?.user_id; // from auth middleware
    console.log(req.user)
    const result = await taskService.deleteTask(taskId, userId);

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      data: result
    });

  } catch (error) {
    console.error("Delete Task Error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to delete task"
    });
  }
};

const updateTaskDescription = async (req, res) => {
    try {
        const taskId = req.params.id;
        const { description } = req.body;

        if (!description) {
            return res.status(400).json({
                success: false,
                message: "Description is required",
            });
        }

        const updatedTask = await taskService.updateTaskDescription(
            taskId,
            description
        );

        return res.status(200).json({
            success: true,
            message: "Task description updated successfully",
            data: updatedTask,
        });
    } catch (error) {
      console.log(error)
        console.error("Update Description Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
};

module.exports = {
  createTask,
  removeAssignment,
  getTasks,
  getTaskById,
  updateTask,
  assignUsers,
  changeStatus,
  createSubtask,
  getSubtasks,
  addTaskChecklist,
  getTasksOverview,
  getProjectTasks,
  approveTask,
  changeTaskType,
  changePriority,
  changeTaskTags,
  deleteTask,
  updateTaskDescription
};
