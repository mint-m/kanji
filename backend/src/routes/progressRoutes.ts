import { Router } from 'express';
import progressController from '../controllers/progressController';
import deckController from '../controllers/deckController';
import { validateProgressRequest, validateDeckRequest } from '../middleware/validation';

const router = Router();

router.get('/', progressController.getAllSessions);
router.get('/stats', progressController.getLearningStats);
router.get('/:type', validateProgressRequest.getProgress, progressController.getUserProgress);

router.put('/:type/index', validateProgressRequest.updateIndex, progressController.updateWordIndex);
router.put('/:type/reset', validateProgressRequest.getProgress, progressController.resetSession);

router.delete('/:type', validateProgressRequest.getProgress, progressController.deleteSession);

router.get('/:progressType/current', validateDeckRequest.progressType, deckController.getCurrentDeck);
router.get('/:progressType/deck-stats', validateDeckRequest.progressType, deckController.getDeckStats);
router.post('/:progressType/complete-word', validateDeckRequest.completeWord, deckController.completeWord);
router.post('/:progressType/bulk-complete', validateDeckRequest.bulkCompleteWords, deckController.bulkCompleteWords);
router.post('/:progressType/complete-deck', validateDeckRequest.completeDeck, deckController.completeDeck);

export default router;
