// src/modules/tasks/tasks.routes.js
import { Router } from 'express';
import { TasksController } from './tasks.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createTaskSchema,
  updateProgressSchema,
  approveTaskSchema,
  addCommentSchema,
} from '../../validators/tasks.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', TasksController.list);
router.post('/', validate(createTaskSchema), TasksController.create);
router.get('/:id', TasksController.getById);
router.put('/:id/progress', validate(updateProgressSchema), TasksController.updateProgress);
router.post('/:id/approve', validate(approveTaskSchema), TasksController.approve);
router.post('/:id/comments', validate(addCommentSchema), TasksController.addComment);

export default router;
