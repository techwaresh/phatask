// src/modules/files/files.routes.js
import { Router } from 'express';
import { FilesController, multerUpload } from './files.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/upload', multerUpload, FilesController.upload);

export default router;
