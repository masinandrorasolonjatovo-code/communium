import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { uploadFile, deleteFile } from '../utils/fileUpload';

const prisma = new PrismaClient();

// Types pour les données d'entrée
interface CreateProfileData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  country?: string;
  city?: string;
  address?: string;
  currentJobTitle?: string;
  currentCompany?: string;
  currentIndustry?: string;
}

interface UpdateProfileSettingsData {
  showEmail?: boolean;
  showPhone?: boolean;
  showDateOfBirth?: boolean;
  showAddress?: boolean;
  showProfessionalExp?: boolean;
  showInterests?: boolean;
  showCV?: boolean;
  profileVisibility?: 'Public' | 'Private' | 'ContactsOnly';
  allowSearchEngines?: boolean;
  allowNetworkingRequests?: boolean;
}

interface ProfessionalExperienceData {
  jobTitle: string;
  company: string;
  industry?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  location?: string;
}

export class ProfileController {
  // Créer ou mettre à jour un profil
  static async createOrUpdateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      const profileData: CreateProfileData = req.body;

      // Générer une URL publique unique si elle n'existe pas
      let publicProfileUrl = profileData.firstName && profileData.lastName
        ? `${profileData.firstName.toLowerCase()}-${profileData.lastName.toLowerCase()}-${userId}`
        : `user-${userId}`;

      // Vérifier l'unicité de l'URL publique
      const existingProfile = await prisma.profile.findFirst({
        where: { publicProfileUrl }
      });

      if (existingProfile && existingProfile.userId !== userId) {
        publicProfileUrl = `${publicProfileUrl}-${Date.now()}`;
      }

      const profile = await prisma.profile.upsert({
        where: { userId },
        update: {
          ...profileData,
          dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : undefined,
          publicProfileUrl,
          updatedAt: new Date()
        },
        create: {
          userId,
          ...profileData,
          dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : undefined,
          publicProfileUrl
        },
        include: {
          professionalExperiences: true,
          interests: {
            include: { interest: true }
          },
          privacySettings: true
        }
      });

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('Erreur lors de la création/mise à jour du profil:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  // Récupérer le profil de l'utilisateur connecté
  static async getMyProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      const profile = await prisma.profile.findUnique({
        where: { userId },
        include: {
          professionalExperiences: {
            orderBy: { startDate: 'desc' }
          },
          interests: {
            include: { interest: true }
          },
          privacySettings: true,
          user: {
            select: {
              username: true,
              email: true,
              role: true
            }
          }
        }
      });

      if (!profile) {
        return res.status(404).json({ error: 'Profil non trouvé' });
      }

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  // Récupérer un profil public par URL
  static async getPublicProfile(req: Request, res: Response) {
    try {
      const { profileUrl } = req.params;

      const profile = await prisma.profile.findUnique({
        where: { publicProfileUrl: profileUrl },
        include: {
          professionalExperiences: {
            where: { OR: [
              { endDate: { not: null } },
              { isCurrent: true }
            ]},
            orderBy: { startDate: 'desc' }
          },
          interests: {
            include: { interest: true }
          },
          privacySettings: true,
          user: {
            select: {
              username: true,
              role: true
            }
          }
        }
      });

      if (!profile) {
        return res.status(404).json({ error: 'Profil non trouvé' });
      }

      // Appliquer les paramètres de confidentialité
      const settings = profile.privacySettings;
      if (!settings || settings.profileVisibility === 'Private') {
        return res.status(403).json({ error: 'Ce profil est privé' });
      }

      // Filtrer les données selon la confidentialité
      const publicProfile = {
        ...profile,
        email: settings.showEmail ? profile.email : undefined,
        phone: settings.showPhone ? profile.phone : undefined,
        dateOfBirth: settings.showDateOfBirth ? profile.dateOfBirth : undefined,
        address: settings.showAddress ? profile.address : undefined,
        professionalExperiences: settings.showProfessionalExp ? profile.professionalExperiences : [],
        interests: settings.showInterests ? profile.interests : [],
        cvUrl: settings.showCV ? profile.cvUrl : undefined
      };

      res.json({
        success: true,
        data: publicProfile
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du profil public:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  // Mettre à jour la photo de profil
  static async updateProfilePicture(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      // Upload du fichier
      const fileUrl = await uploadFile(req.file, 'profile-pictures');

      // Supprimer l'ancienne photo si elle existe
      const existingProfile = await prisma.profile.findUnique({
        where: { userId },
        select: { profilePictureUrl: true }
      });

      if (existingProfile?.profilePictureUrl) {
        await deleteFile(existingProfile.profilePictureUrl);
      }

      // Mettre à jour le profil
      const profile = await prisma.profile.update({
        where: { userId },
        data: {
          profilePictureUrl: fileUrl,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        data: {
          profilePictureUrl: fileUrl
        }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la photo de profil:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  // Mettre à jour les coordonnées de recadrage de la photo
  static async updateProfilePictureCrop(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      const { crop } = req.body;
      if (!crop || typeof crop !== 'object') {
        return res.status(400).json({ error: 'Coordonnées de recadrage invalides' });
      }

      const profile = await prisma.profile.update({
        where: { userId },
        data: {
          profilePictureCrop: crop,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        data: {
          profilePictureCrop: crop
        }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du recadrage:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  // Upload du CV
  static async uploadCV(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      // Vérifier que c'est un PDF
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: 'Le fichier doit être un PDF' });
      }

      // Upload du fichier
      const fileUrl = await uploadFile(req.file, 'cvs');

      // Supprimer l'ancien CV si il existe
      const existingProfile = await prisma.profile.findUnique({
        where: { userId },
        select: { cvUrl: true }
      });

      if (existingProfile?.cvUrl) {
        await deleteFile(existingProfile.cvUrl);
      }

      // Mettre à jour le profil
      const profile = await prisma.profile.update({
        where: { userId },
        data: {
          cvUrl: fileUrl,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        data: {
          cvUrl: fileUrl
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload du CV:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  // Upload du document d'identité
  static async uploadIdentityDocument(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      const { documentType, documentNumber } = req.body;

      if (!documentType || !['CIN', 'PASSPORT', 'DRIVING_LICENSE'].includes(documentType)) {
        return res.status(400).json({ error: 'Type de document invalide' });
      }

      // Upload du fichier
      const fileUrl = await uploadFile(req.file, 'identity-documents');

      // Supprimer l'ancien document si il existe
      const existingProfile = await prisma.profile.findUnique({
        where: { userId },
        select: { identityDocumentUrl: true }
      });

      if (existingProfile?.identityDocumentUrl) {
        await deleteFile(existingProfile.identityDocumentUrl);
      }

      // Mettre à jour le profil
      const profile = await prisma.profile.update({
        where: { userId },
        data: {
          identityDocumentType: documentType as any,
          identityDocumentNumber: documentNumber,
          identityDocumentUrl: fileUrl,
          identityVerified: false, // À vérifier manuellement
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        data: {
          identityDocumentUrl: fileUrl,
          identityDocumentType: documentType,
          identityVerified: false
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload du document d\'identité:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  // Gestion des expériences professionnelles
  static async addProfessionalExperience(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      const experienceData: ProfessionalExperienceData = req.body;

      // Validation des données
      if (!experienceData.jobTitle || !experienceData.company || !experienceData.startDate) {
        return res.status(400).json({ error: 'Titre du poste, entreprise et date de début sont requis' });
      }

      // Récupérer le profil
      const profile = await prisma.profile.findUnique({
        where: { userId }
      });

      if (!profile) {
        return res.status(404).json({ error: 'Profil non trouvé' });
      }

      // Si c'est l'expérience actuelle, désactiver les autres
      if (experienceData.isCurrent) {
        await prisma.professionalExperience.updateMany({
          where: { profileId: profile.id },
          data: { isCurrent: false }
        });
      }

      const experience = await prisma.professionalExperience.create({
        data: {
          profileId: profile.id,
          ...experienceData,
          startDate: new Date(experienceData.startDate),
          endDate: experienceData.endDate ? new Date(experienceData.endDate) : null
        }
      });

      res.json({
        success: true,
        data: experience
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'expérience professionnelle:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  static async updateProfessionalExperience(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { experienceId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      const experienceData: Partial<ProfessionalExperienceData> = req.body;

      // Vérifier que l'expérience appartient à l'utilisateur
      const experience = await prisma.professionalExperience.findFirst({
        where: {
          id: parseInt(experienceId),
          profile: { userId }
        }
      });

      if (!experience) {
        return res.status(404).json({ error: 'Expérience professionnelle non trouvée' });
      }

      // Si on marque comme actuelle, désactiver les autres
      if (experienceData.isCurrent) {
        await prisma.professionalExperience.updateMany({
          where: {
            profileId: experience.profileId,
            id: { not: experience.id }
          },
          data: { isCurrent: false }
        });
      }

      const updatedExperience = await prisma.professionalExperience.update({
        where: { id: experience.id },
        data: {
          ...experienceData,
          startDate: experienceData.startDate ? new Date(experienceData.startDate) : undefined,
          endDate: experienceData.endDate ? new Date(experienceData.endDate) : null
        }
      });

      res.json({
        success: true,
        data: updatedExperience
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'expérience professionnelle:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  static async deleteProfessionalExperience(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { experienceId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      // Vérifier que l'expérience appartient à l'utilisateur
      const experience = await prisma.professionalExperience.findFirst({
        where: {
          id: parseInt(experienceId),
          profile: { userId }
        }
      });

      if (!experience) {
        return res.status(404).json({ error: 'Expérience professionnelle non trouvée' });
      }

      await prisma.professionalExperience.delete({
        where: { id: experience.id }
      });

      res.json({
        success: true,
        message: 'Expérience professionnelle supprimée'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'expérience professionnelle:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  // Gestion des centres d'intérêt
  static async addInterest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      const { interestId } = req.body;

      if (!interestId) {
        return res.status(400).json({ error: 'ID de l\'intérêt requis' });
      }

      // Récupérer le profil
      const profile = await prisma.profile.findUnique({
        where: { userId }
      });

      if (!profile) {
        return res.status(404).json({ error: 'Profil non trouvé' });
      }

      // Vérifier que l'intérêt existe
      const interest = await prisma.interest.findUnique({
        where: { id: parseInt(interestId) }
      });

      if (!interest) {
        return res.status(404).json({ error: 'Intérêt non trouvé' });
      }

      // Ajouter l'intérêt au profil
      const profileInterest = await prisma.profileInterest.create({
        data: {
          profileId: profile.id,
          interestId: parseInt(interestId)
        },
        include: {
          interest: true
        }
      });

      res.json({
        success: true,
        data: profileInterest
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'intérêt:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  static async removeInterest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { interestId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      // Récupérer le profil
      const profile = await prisma.profile.findUnique({
        where: { userId }
      });

      if (!profile) {
        return res.status(404).json({ error: 'Profil non trouvé' });
      }

      // Supprimer l'intérêt du profil
      await prisma.profileInterest.deleteMany({
        where: {
          profileId: profile.id,
          interestId: parseInt(interestId)
        }
      });

      res.json({
        success: true,
        message: 'Intérêt supprimé du profil'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'intérêt:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  // Récupérer la liste des intérêts disponibles
  static async getAvailableInterests(req: Request, res: Response) {
    try {
      const interests = await prisma.interest.findMany({
        orderBy: { name: 'asc' }
      });

      res.json({
        success: true,
        data: interests
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des intérêts:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  // Gestion des paramètres de confidentialité
  static async updatePrivacySettings(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      const settingsData: UpdateProfileSettingsData = req.body;

      // Récupérer le profil
      const profile = await prisma.profile.findUnique({
        where: { userId }
      });

      if (!profile) {
        return res.status(404).json({ error: 'Profil non trouvé' });
      }

      const settings = await prisma.profileSettings.upsert({
        where: { profileId: profile.id },
        update: settingsData,
        create: {
          profileId: profile.id,
          ...settingsData
        }
      });

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres de confidentialité:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  // Vérifier la disponibilité d'une URL de profil
  static async checkProfileUrlAvailability(req: Request, res: Response) {
    try {
      const { url } = req.params;
      const userId = (req as any).user?.id;

      const existingProfile = await prisma.profile.findFirst({
        where: {
          publicProfileUrl: url,
          userId: { not: userId } // Exclure son propre profil
        }
      });

      res.json({
        success: true,
        data: {
          available: !existingProfile
        }
      });
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'URL:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }
}