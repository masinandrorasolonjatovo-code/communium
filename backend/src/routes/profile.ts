import { Router } from 'express';
import { ProfileController } from '../controllers/profileController';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';

const router = Router();

// Configuration de multer pour l'upload de fichiers
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accepter les images et PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté'));
    }
  }
});

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// Routes pour le profil de base
router.get('/my-profile', ProfileController.getMyProfile);
router.put('/my-profile', ProfileController.createOrUpdateProfile);

// Routes pour la photo de profil
router.post('/profile-picture', upload.single('profilePicture'), ProfileController.updateProfilePicture);
router.put('/profile-picture/crop', ProfileController.updateProfilePictureCrop);

// Routes pour les documents
router.post('/cv', upload.single('cv'), ProfileController.uploadCV);
router.post('/identity-document', upload.single('identityDocument'), ProfileController.uploadIdentityDocument);

// Routes pour les expériences professionnelles
router.post('/professional-experience', ProfileController.addProfessionalExperience);
router.put('/professional-experience/:experienceId', ProfileController.updateProfessionalExperience);
router.delete('/professional-experience/:experienceId', ProfileController.deleteProfessionalExperience);

// Routes pour les centres d'intérêt
router.get('/interests/available', ProfileController.getAvailableInterests);
router.post('/interests', ProfileController.addInterest);
router.delete('/interests/:interestId', ProfileController.removeInterest);

// Routes pour les paramètres de confidentialité
router.put('/privacy-settings', ProfileController.updatePrivacySettings);

// Routes publiques (sans authentification requise)
router.get('/public/:profileUrl', ProfileController.getPublicProfile);
router.get('/check-url/:url', ProfileController.checkProfileUrlAvailability);

export default router;