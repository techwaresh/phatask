// src/modules/projects/projects.routes.js
import { Router } from 'express';
import { ProjectsController } from './projects.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', ProjectsController.list);
router.post('/', ProjectsController.create);
router.get('/:id', ProjectsController.getById);
router.put('/:id/stage', ProjectsController.saveStageData);
router.post('/:id/advance', ProjectsController.advanceStage);
router.post('/:id/tasks', ProjectsController.createTask);
router.post('/:id/files', ProjectsController.addFile);

export default router;
