// src/modules/plans/plans.routes.js
import { Router } from 'express';
import { PlansController } from './plans.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createPlanSchema,
  updatePlanSchema,
  approvalActionSchema,
} from '../../validators/plans.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', PlansController.list);
router.post('/', validate(createPlanSchema), PlansController.create);
router.get('/:id', PlansController.getById);
router.put('/:id', validate(updatePlanSchema), PlansController.update);
router.post('/:id/submit', PlansController.submit);
router.post('/:id/action', validate(approvalActionSchema), PlansController.approvalAction);

export default router;
