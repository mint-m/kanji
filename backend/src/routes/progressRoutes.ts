import { Router } from 'express';
import progressController from '../controllers/progressController';
import { authenticateUser } from '../middleware/auth';
import { validateProgressRequest } from '../middleware/validation';

const router = Router();

// All progress routes require authentication
router.use(authenticateUser);

/**
 * @route   GET /api/progress
 * @desc    Get all active learning sessions for user
 * @access  Private
 */
router.get('/', progressController.getAllSessions);

/**
 * @route   GET /api/progress/stats
 * @desc    Get comprehensive learning statistics
 * @access  Private
 */
router.get('/stats', progressController.getLearningStats);

/**
 * @route   GET /api/progress/:type
 * @desc    Get specific session progress (main/sub)
 * @access  Private
 * @param   {string} type - Session type: 'main' or 'sub'
 */
router.get('/:type', validateProgressRequest.getProgress, progressController.getUserProgress);

/**
 * @route   POST /api/progress
 * @desc    Create new learning session
 * @access  Private
 * @body    {type: 'main'|'sub', level: 'N5'|'N4'|'N3'|'N2'|'N1', steps: {start: number, end: number}}
 */
router.post('/', validateProgressRequest.createSession, progressController.createSession);

/**
 * @route   POST /api/progress/switch
 * @desc    Switch between main and sub session types
 * @access  Private
 * @body    {fromType: 'main'|'sub', toType: 'main'|'sub'}
 */
router.post('/switch', validateProgressRequest.switchSession, progressController.switchSessionType);

/**
 * @route   PUT /api/progress/:type/index
 * @desc    Update current word index in session
 * @access  Private
 * @param   {string} type - Session type: 'main' or 'sub'
 * @body    {action: 'next'|'previous'|'jump', index?: number}
 */
router.put('/:type/index', validateProgressRequest.updateIndex, progressController.updateWordIndex);

/**
 * @route   PUT /api/progress/:type/reset
 * @desc    Reset session progress to beginning
 * @access  Private
 * @param   {string} type - Session type: 'main' or 'sub'
 */
router.put('/:type/reset', validateProgressRequest.getProgress, progressController.resetSession);

/**
 * @route   POST /api/progress/:type/next-window
 * @desc    Generate next sliding window deck
 * @access  Private
 * @param   {string} type - Session type: 'main' or 'sub'
 */
router.post('/:type/next-window', validateProgressRequest.getProgress, progressController.generateNextWindow);

/**
 * @route   DELETE /api/progress/:type
 * @desc    Delete entire learning session
 * @access  Private
 * @param   {string} type - Session type: 'main' or 'sub'
 */
router.delete('/:type', validateProgressRequest.getProgress, progressController.deleteSession);

export default router;