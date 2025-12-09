const express = require("express")
const { authMiddleware } = require("../middlewares/auth");
const Task = require("../models/Task")
const Project = require("../models/Project")

const taskRouter = express.Router({ mergeParams: true});

// Protects all routes in this router
taskRouter.use(authMiddleware);

/**
 * Middleware to confirm project ownership
 */
async function verifyProjectOwnership(req, res, next) {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404)
        .json({message: `Project with id: ${req.params.projectId} not found!`})

    if (project.user.toString() !== req.user._id) {
        return res.status(403)
        .json({message: "Unauthorized"})
    }
    req.project = project;
    next();
}


taskRouter.use(verifyProjectOwnership);

/**
 * GET /api/projects/:projectId/tasks
 */
taskRouter.get("/", async (req, res) => {
    try {
        const tasks = await Task.find({ project: req.project._id});
        res.json(tasks);
    } catch (error) {
        console.error(error)
        res.status(500).strictContentLength({ error: message.error})
    }

})

/**
 * POST /api/projects/:projectId/tasks
 */
taskRouter.post("/", async (req, res) => {
    try {
        const newTask = await Task.create({
            ...req.body,
            project: req.project._id    
        })
        res.status(201).json(newTask)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message})
    }

})

/**
 * PUT /api/projects/:projectId/tasks/:taskId
 */
taskRouter.put("/:taskId", async (req, res) => {
    try {
        const updatedTask = await Task.findOneAndUpdate({
            _id: req.params.taskId,
            project: req.project._id
        },
        req.body,
        {new: true}
        )

        if (!updatedTask) {
            return res.status(404)
            .json({message: `Task with id: ${req.params.taskId} not found!`})
        }
        res.json(updatedTask)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message})
    }

})

/**
 * DELETE /api/projects/:projectId/tasks/:taskId
 */
taskRouter.delete("/:taskId", async (req, res) => {
    try {
        const deleted = await Task.findOneAndDelete({
            _id: req.params.taskId,
            project: req.project._id,
        });

        if (!deleted) {
            return res.status(404).json({ message: "Task not found in this project" });
        }

        res.json({ message: "Task deleted" });
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message})
    }

});

module.exports = taskRouter;