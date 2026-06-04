import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configuration des dossiers d'upload
const UPLOAD_DIRS = {
  'profile-pictures': 'uploads/profile-pictures',
  'cvs': 'uploads/cvs',
  'identity-documents': 'uploads/identity-documents'
};

// Créer les dossiers s'ils n'existent pas
async function ensureUploadDir(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// Générer un nom de fichier unique
function generateUniqueFilename(originalFilename: string): string {
  const extension = path.extname(originalFilename);
  const basename = path.basename(originalFilename, extension);
  const uniqueId = uuidv4();
  return `${basename}-${uniqueId}${extension}`;
}

// Upload d'un fichier
export async function uploadFile(
  file: Express.Multer.File,
  type: keyof typeof UPLOAD_DIRS
): Promise<string> {
  const uploadDir = UPLOAD_DIRS[type];

  if (!uploadDir) {
    throw new Error(`Type d'upload non supporté: ${type}`);
  }

  // Créer le dossier si nécessaire
  await ensureUploadDir(uploadDir);

  // Générer un nom de fichier unique
  const filename = generateUniqueFilename(file.originalname);
  const filePath = path.join(uploadDir, filename);

  // Écrire le fichier
  await fs.writeFile(filePath, file.buffer);

  // Retourner l'URL relative du fichier
  // En production, cela devrait retourner une URL complète (ex: S3)
  return `/${filePath.replace(/\\/g, '/')}`;
}

// Supprimer un fichier
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    // Convertir l'URL en chemin local
    const filePath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;

    // Vérifier que le fichier existe dans un dossier d'upload autorisé
    const isInUploadDir = Object.values(UPLOAD_DIRS).some(dir =>
      filePath.startsWith(dir)
    );

    if (!isInUploadDir) {
      console.warn(`Tentative de suppression d'un fichier hors des dossiers autorisés: ${filePath}`);
      return;
    }

    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Erreur lors de la suppression du fichier ${fileUrl}:`, error);
    // Ne pas throw l'erreur pour éviter de casser le flux principal
  }
}

// Vérifier si un fichier existe
export async function fileExists(fileUrl: string): Promise<boolean> {
  try {
    const filePath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Obtenir les informations d'un fichier
export async function getFileInfo(fileUrl: string): Promise<{ size: number; mimeType?: string } | null> {
  try {
    const filePath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
    const stats = await fs.stat(filePath);

    return {
      size: stats.size,
      // Le type MIME pourrait être déterminé avec une bibliothèque comme 'file-type'
      // Pour l'instant, on ne le retourne pas
    };
  } catch {
    return null;
  }
}