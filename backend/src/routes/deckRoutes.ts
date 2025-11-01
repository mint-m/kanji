import { Router } from 'express';
import deckController from '../controllers/deckController';
import { authenticateUser } from '../middleware/auth';
import { validateDeckRequest } from '../middleware/validation';

const router = Router();

// All deck routes require authentication
router.use(authenticateUser);

/**
 * @route   POST /api/deck/generate
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
 * @route   GET /api/deck/:progressType/current
 * @desc    Get current deck from active session
 * @access  Private
 * @param   {string} progressType - Session type: 'main' or 'sub'
 */
router.get('/:progressType/current', validateDeckRequest.progressType, deckController.getCurrentDeck);

/**
 * @route   GET /api/deck/:progressType/stats
 * @desc    Get comprehensive deck statistics and analytics
 * @access  Private
 * @param   {string} progressType - Session type: 'main' or 'sub'
 */
router.get('/:progressType/stats', validateDeckRequest.progressType, deckController.getDeckStats);

/**
 * @route   POST /api/deck/:progressType/complete-word
 * @desc    Mark single word as completed or incorrect
 * @access  Private
 * @param   {string} progressType - Session type: 'main' or 'sub'
 * @body    {
 *            wordId: string,
 *            isCorrect: boolean,
 *            timeSpent?: number,
 *            difficulty?: 'easy'|'medium'|'hard'
 *          }
 */
router.post('/:progressType/complete-word', validateDeckRequest.completeWord, deckController.completeWord);

/**
 * @route   POST /api/deck/:progressType/bulk-complete
 * @desc    Mark multiple words as completed (bulk operation)
 * @access  Private
 * @param   {string} progressType - Session type: 'main' or 'sub'
 * @body    {
 *            completions: Array<{
 *              wordId: string,
 *              isCorrect: boolean,
 *              timeSpent?: number,
 *              difficulty?: 'easy'|'medium'|'hard'
 *            }>
 *          }
 */
router.post('/:progressType/bulk-complete', validateDeckRequest.bulkCompleteWords, deckController.bulkCompleteWords);

/**
 * @route   POST /api/deck/:progressType/complete-deck
 * @desc    Complete entire deck and optionally generate next sliding window
 * @access  Private
 * @param   {string} progressType - Session type: 'main' or 'sub'
 * @body    {
 *            autoGenerateNext?: boolean,
 *            sessionFeedback?: {
 *              difficulty: 'too_easy'|'just_right'|'too_hard',
 *              enjoyment: number,
 *              notes?: string
 *            }
 *          }
 */
router.post('/:progressType/complete-deck', validateDeckRequest.completeDeck, deckController.completeDeck);

export default router;
