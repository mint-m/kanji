import { Router } from 'express';
import progressController from '../controllers/progressController';
import deckController from '../controllers/deckController';
import { validateProgressRequest, validateDeckRequest } from '../middleware/validation';

const router = Router();

router.get('/', progressController.getAllSessions);
router.get('/:type', validateProgressRequest.getProgress, progressController.getUserProgress);

router.delete('/:type', validateProgressRequest.getProgress, progressController.deleteSession);

router.get('/:progressType/current', validateDeckRequest.progressType, deckController.getCurrentDeck);
router.post('/:progressType/complete-word', validateDeckRequest.completeWord, deckController.completeWord);
router.post('/:progressType/complete-deck', validateDeckRequest.completeDeck, deckController.completeDeck);

export default router;
