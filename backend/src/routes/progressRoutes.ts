import { Router } from 'express';
import progressController from '../controllers/progressController';
import deckController from '../controllers/deckController';
import { authenticateUser } from '../middleware/auth';
import { validateProgressRequest, validateDeckRequest } from '../middleware/validation';

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
 * @route   POST /api/progress/updateCheckpoint
 * @desc    Update checkpoint for current session
 * @access  Private
 * @body    {progressCheckpoint: {progress_type, level?, steps?, currentWordIndex?}}
 */
router.post('/updateCheckpoint', validateProgressRequest.updateCheckpoint, progressController.updateCheckpoint);

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

// ========================================
// DECK OPERATIONS (merged from deckRoutes)
// ========================================

/**
 * @route   POST /api/progress/generate
 * @desc    Generate new sliding window deck
 * @access  Private
 * @body    {
 *            level: 'N5'|'N4'|'N3'|'N2'|'N1',
 *            steps: {start: number, end: number},
 *            progressType: 'main'|'sub',
 *            options?: {
 *              excludeCompleted?: boolean,
 *              prioritizeBookmarked?: boolean,
 *              shuffleOrder?: boolean,
 *              maxWords?: number
 *            }
 *          }
 */
router.post('/generate', validateDeckRequest.generateDeck, deckController.generateDeck);

/**
 * @route   GET /api/progress/:progressType/current
 * @desc    Get current deck from active session
 * @access  Private
 * @param   {string} progressType - Session type: 'main' or 'sub'
 */
router.get('/:progressType/current', validateDeckRequest.progressType, deckController.getCurrentDeck);

/**
 * @route   GET /api/progress/:progressType/deck-stats
 * @desc    Get comprehensive deck statistics and analytics
 * @access  Private
 * @param   {string} progressType - Session type: 'main' or 'sub'
 */
router.get('/:progressType/deck-stats', validateDeckRequest.progressType, deckController.getDeckStats);

/**
 * @route   POST /api/progress/:progressType/complete-word
 * @desc    Mark single word as completed or incorrect
 * @access  Private
 * @param   {string} progressType - Session type: 'main' or 'sub'
 * @body    {
 *            wordId: string,
 *            isCorrect: boolean,
 *            timeSpent?: number,
 *          }
 */
router.post('/:progressType/complete-word', validateDeckRequest.completeWord, deckController.completeWord);

/**
 * @route   POST /api/progress/:progressType/bulk-complete
 * @desc    Mark multiple words as completed (bulk operation)
 * @access  Private
 * @param   {string} progressType - Session type: 'main' or 'sub'
 * @body    {
 *            completions: Array<{
 *              wordId: string,
 *              isCorrect: boolean,
 *              timeSpent?: number,
 *            }>
 *          }
 */
router.post('/:progressType/bulk-complete', validateDeckRequest.bulkCompleteWords, deckController.bulkCompleteWords);

/**
 * @route   POST /api/progress/:progressType/complete-deck
 * @desc    Complete entire deck and optionally generate next sliding window
 * @access  Private
 * @param   {string} progressType - Session type: 'main' or 'sub'
 * @body    {
 *            autoGenerateNext?: boolean,
 *            sessionFeedback?: {
 *              enjoyment: number,
 *              notes?: string
 *            }
 *          }
 */
router.post('/:progressType/complete-deck', validateDeckRequest.completeDeck, deckController.completeDeck);

export default router;
