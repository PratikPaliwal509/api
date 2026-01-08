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
    console.error(err);
    return errorResponse(res, err.message);
  }
};

/**
 * GET /tasks
 */
const getTasks = async (req, res) => {
  try {
    const tasks = await taskService.getTasks(req.query);
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

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  assignUsers,
  changeStatus,
  createSubtask,
  getSubtasks
};
