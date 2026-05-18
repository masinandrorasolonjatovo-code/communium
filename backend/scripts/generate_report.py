import os
from datetime import datetime

try:
    from docx import Document
    from docx.shared import Pt
except Exception:
    raise SystemExit('python-docx is required. Run: pip install python-docx')


def add_heading(doc, text, level=1):
    doc.add_heading(text, level=level)


def add_paragraph(doc, text, bold=False):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.font.size = Pt(11)
    run.bold = bold


def add_placeholder_image(doc, label):
    p = doc.add_paragraph()
    run = p.add_run(f'[PLACEHOLDER IMAGE: {label}]')
    run.italic = True


def include_file_excerpt(doc, path, max_lines=40):
    # This function is intentionally left minimal for the narrative report.
    if not os.path.exists(path):
        add_paragraph(doc, f'Fichier introuvable: {path}')
        return
    add_paragraph(doc, f'Le fichier {os.path.basename(path)} est disponible dans le dépôt. Extrait non inclus dans ce rapport.')


def build_report(output_path):
    doc = Document()

    # Title
    doc.add_heading('Rapport hebdomadaire — Module 2 (Paiements & Tks)', 0)
    add_paragraph(doc, f'Date du rapport : {datetime.utcnow().strftime("%Y-%m-%d UTC")}', bold=False)
    add_paragraph(doc, 'Période : Semaine 4', bold=False)

    # Executive summary
    add_heading(doc, 'Résumé exécutif', level=1)
    add_paragraph(doc, 'Cette semaine, l\'activité s\'est concentrée sur le Module 2 (Paiements et économie Tks). Le code backend expose les endpoints de gestion des wallets, des packages Tks et des commandes. Le schéma de base de données pour les paiements et le wallet est présent dans le dépôt. Les intégrations externes (Stripe, CMI) sont répertoriées mais partiellement implémentées; des placeholders et webhooks restent à ajouter.')

    # Objectives
    add_heading(doc, 'Objectifs de la semaine', level=1)
    add_paragraph(doc, '- Documenter l\'état actuel du module 2 et fournir un rapport pour les encadreurs.')
    add_paragraph(doc, '- Préparer les artefacts pour l\'intégration Stripe/CMI et le suivi des Tks.')

    # Work performed
    add_heading(doc, 'Travail réalisé', level=1)
    add_paragraph(doc, '1) Exploration du dépôt et inventaire des fichiers liés aux paiements (backend, frontend, database).')
    add_paragraph(doc, '2) Identification des endpoints existants dans `backend/server.js` pour: création d\'ordre Tks, gestion du wallet, factures et remboursements.')
    add_paragraph(doc, '3) Préparation d\'un script automatique pour générer ce rapport (fichier Word) et inclusion d\'extraits de schéma si disponibles.')

    # Technical details
    add_heading(doc, 'Détails techniques', level=1)
    add_paragraph(doc, 'Architecture (haut niveau):')
    add_paragraph(doc, '- Frontend Next.js interroge les endpoints du backend pour créer des commandes et afficher le wallet.')
    add_paragraph(doc, '- Backend Node.js/Express gère les endpoints de paiement, les transactions wallet et les factures, avec une base de données SQL décrivant les tables `tks_packages`, `wallets`, `wallet_transactions`, `invoices` etc.')

    add_paragraph(doc, 'Flux d\'achat de Tks (résumé):')
    add_paragraph(doc, '1. L\'utilisateur sélectionne un package Tks sur l\'interface. 2. Le frontend appelle l\'endpoint de création d\'ordre. 3. Le backend crée une `tks_purchase_order` et attend la confirmation du paiement (webhook ou marquage manuel). 4. Après confirmation, le backend crédite le wallet et génère une facture.')

    add_paragraph(doc, 'État des intégrations externes:')
    add_paragraph(doc, '- Stripe: clé référencée dans le fichier `.env` du backend mais appels SDK non implémentés dans le backend. Webhooks Stripe à ajouter.')
    add_paragraph(doc, '- CMI: configuration existante en base mais intégration serveur manquante (redirection/validation signature).')

    # High-level architecture notes (no code excerpts)
    add_heading(doc, 'Schéma de base de données et API (haute niveau)', level=1)
    add_paragraph(doc, 'Le schéma de base de données complet est présent dans le dépôt sous `database/m2_payments_tks.sql`. Par souci de clarté pour les encadreurs, ce rapport conserve un niveau narratif et ne reproduit pas d\'extraits de code ou de SQL.')
    add_paragraph(doc, 'Endpoints principaux (liste descriptive):')
    add_paragraph(doc, '- Création d\'ordre Tks (flux d\'achat)')
    add_paragraph(doc, '- Marquage/confimation de paiement (webhook ou marquage manuel)')
    add_paragraph(doc, '- Consultation du wallet et historique des transactions')
    add_paragraph(doc, '- Création et consultation des factures et remboursements')

    # Tests & validations
    add_heading(doc, 'Tests et validations', level=1)
    add_paragraph(doc, 'Aucun test automatisé spécifique aux paiements n\'a été détecté dans le dépôt cette semaine. Il est recommandé d\'ajouter :')
    add_paragraph(doc, '- Tests unitaires pour la logique de wallet (crédit/débit, verrou de solde)')
    add_paragraph(doc, '- Tests d\'intégration pour le flux de création d\'ordre + webhook')

    # Blockers and risks
    add_heading(doc, 'Difficultés rencontrées et risques', level=1)
    add_paragraph(doc, '- Intégrations Stripe/CMI non finalisées; nécessite accès aux clés et configuration des webhooks.')
    add_paragraph(doc, '- Conformité TVA / facturation marocaine demandera vérification légale pour le format des factures.')

    # Next steps
    add_heading(doc, 'Prochaines étapes', level=1)
    add_paragraph(doc, '1. Installer et initialiser le SDK Stripe côté backend; ajouter handler webhook et valider `charge.succeeded`.')
    add_paragraph(doc, '2. Implémenter le flow CMI (redirection + validation signature) et synchroniser avec les mêmes webhooks/événements.')
    add_paragraph(doc, '3. Générer les factures PDF côté backend (librairie PDF) et sauvegarder `pdf_url` dans la table `invoices`.')
    add_paragraph(doc, '4. Ajouter tests automatisés et pipeline CI pour valider le module.')

    # Annexes placeholders
    add_heading(doc, 'Annexes', level=1)
    add_paragraph(doc, 'A. Captures d\'écran frontend (insérer ici)')
    add_paragraph(doc, 'Remarque : remplacer chaque placeholder par une capture d\'écran provenant du répertoire frontend ou des exports PDF.')
    add_placeholder_image(doc, 'PLACEHOLDER_SCREENSHOT_1 - Dashboard vue d\'ensemble')
    add_placeholder_image(doc, 'PLACEHOLDER_SCREENSHOT_2 - Achat de Tks (flow)')
    add_placeholder_image(doc, 'PLACEHOLDER_SCREENSHOT_3 - Page Wallet / Historique')

    add_paragraph(doc, 'B. Exports / références')
    add_paragraph(doc, '- Schéma SQL : database/m2_payments_tks.sql (disponible dans le dépôt)')
    add_paragraph(doc, '- Backend endpoints : backend/server.js (liste descriptive fournie ci-dessus)')

    # Footer / metadata
    doc.add_page_break()
    add_paragraph(doc, 'Fait par : Équipe The Communium — Module 2')
    add_paragraph(doc, f'Généré le : {datetime.utcnow().isoformat()}')

    # Ensure output dir
    out_dir = os.path.dirname(output_path)
    if out_dir and not os.path.exists(out_dir):
        os.makedirs(out_dir, exist_ok=True)

    # If a previous report exists and is locked, try removing it first.
    try:
        if os.path.exists(output_path):
            os.remove(output_path)
    except Exception:
        pass

    doc.save(output_path)


if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), '..', 'reports', 'rapport_module2_semaine4_generated.docx')
    out = os.path.normpath(out)
    build_report(out)
    print('Report generated at', out)
