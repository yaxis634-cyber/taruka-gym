import { Router } from 'express';
import { CheckController } from '../controllers/check.controller';

export const checkRoutes = Router();

checkRoutes.get('/:codigo', CheckController.verSocio);
