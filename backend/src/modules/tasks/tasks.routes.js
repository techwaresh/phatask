// src/modules/tasks/tasks.routes.js
import { Router } from 'express';
import multer from 'multer';
import { TasksController } from './tasks.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createTaskSchema,
  updateProgressSchema,
  approveTaskSchema,
  addCommentSchema,
} from '../../validators/tasks.validator.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = Router();

router.use(authenticate);

// مسارات تحميل نموذج الإكسل والاستيراد الجماعي (قبل مسار /:id لتفادي التداخل)
router.get('/template', TasksController.downloadTemplate);
router.post('/import', upload.single('file'), TasksController.importTasks);

router.get('/', TasksController.list);
router.post('/', validate(createTaskSchema), TasksController.create);
router.get('/:id', TasksController.getById);
router.put('/:id/progress', validate(updateProgressSchema), TasksController.updateProgress);
router.post('/:id/approve', validate(approveTaskSchema), TasksController.approve);
router.post('/:id/comments', validate(addCommentSchema), TasksController.addComment);

export default router;
