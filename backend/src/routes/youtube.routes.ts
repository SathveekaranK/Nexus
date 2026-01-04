import express from 'express';
import { searchVideo } from '../controllers/youtube.controller';

const router = express.Router();

router.get('/search', searchVideo);

export default router;
