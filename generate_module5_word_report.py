from docx import Document
from docx.shared import Pt, Inches
from PIL import Image, ImageDraw, ImageFont

# Create schema image
width, height = 1200, 850
image = Image.new('RGB', (width, height), 'white')
draw = ImageDraw.Draw(image)
font_title = ImageFont.load_default()
font_text = ImageFont.load_default()

# Title
draw.rectangle([(40, 30), (1160, 100)], outline='#0f172a', width=3, fill='#e2e8f0')
draw.text((60, 45), 'Schéma global du Module 5 - Gestion d\'événements', fill='#0f172a', font=font_title)

def draw_box(x, y, w, h, title, lines):
    draw.rectangle([(x, y), (x + w, y + h)], outline='#0f172a', width=3, fill='#f8fafc')
    draw.text((x + 12, y + 12), title, fill='#0f172a', font=font_title)
    offset_y = y + 40
    for line in lines:
        draw.text((x + 12, offset_y), line, fill='#0f172a', font=font_text)
        offset_y += 18

# Boxes
boxes = [
    (60, 140, 220, 100, 'Utilisateur', ['Visiteur / participant', 'Parcourt les événements', 'S\'inscrit']),
    (360, 120, 260, 120, 'Frontend', ['Affiche le listing', 'Formulaire d\'inscription', 'Redirige vers le paiement']),
    (720, 120, 260, 120, 'Backend', ['Crée et gère les billets', 'Stocke en base', 'Génère PDF + QR']),
    (360, 320, 260, 100, 'Base de données', ['Événements', 'Billets', 'Waitlist']),
    (720, 320, 260, 100, 'Service email', ['Envoi de billet PDF', 'Notifications']),
    (720, 520, 260, 100, 'Fournisseur de paiement', ['Paiement sécurisé', 'Confirmation']),
]
for x, y, w, h, title, lines in boxes:
    draw_box(x, y, w, h, title, lines)

# Arrows
arrow_color = '#0f172a'
arrow_width = 4

def line_with_arrow(start, end):
    draw.line([start, end], fill=arrow_color, width=arrow_width)
    # arrow head
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    length = (dx*dx + dy*dy) ** 0.5
    if length == 0:
        return
    ux, uy = dx / length, dy / length
    perp = (-uy, ux)
    size = 14
    p1 = (end[0] - ux * size + perp[0] * size / 2, end[1] - uy * size + perp[1] * size / 2)
    p2 = (end[0] - ux * size - perp[0] * size / 2, end[1] - uy * size - perp[1] * size / 2)
    draw.polygon([end, p1, p2], fill=arrow_color)

line_with_arrow((280, 190), (360, 190))
line_with_arrow((620, 190), (720, 190))
line_with_arrow((490, 240), (490, 320))
line_with_arrow((830, 240), (830, 320))
line_with_arrow((830, 420), (830, 520))

# Labels near arrows
draw.text((320, 170), 'Demande d\'inscription', fill='#0f172a', font=font_text)
draw.text((680, 170), 'Appel API / création ticket', fill='#0f172a', font=font_text)
draw.text((510, 290), 'Mise à jour des données', fill='#0f172a', font=font_text)
draw.text((840, 290), 'Envoi de billet', fill='#0f172a', font=font_text)
draw.text((840, 480), 'Paiement et confirmation', fill='#0f172a', font=font_text)

# Extra notes
notes = [
    'Flux principal : l\'utilisateur s\'inscrit, le frontend transmet au backend,',
    'le backend traite le billet, stocke les informations et déclenche l\'envoi du PDF.',
    'Pour un événement payant, le backend passe par le fournisseur de paiement',
    'puis confirme la transaction avant d\'envoyer le billet.',
]
text_y = 660
for note in notes:
    draw.text((60, text_y), note, fill='#0f172a', font=font_text)
    text_y += 22

schema_path = 'reports/module5_schema_global.png'
image.save(schema_path)

# Create Word document
report = Document()
report.add_heading('Rapport Module 5 — Système de gestion d\'événements', level=0)
report.add_paragraph('Ce document présente le développement et le fonctionnement du Module 5. Il est rédigé de manière non technique, avec des emplacements réservés pour des captures d\'écran frontend et le schéma global de la solution.')

report.add_heading('1. Introduction', level=1)
report.add_paragraph('Le Module 5 vise à fournir une solution complète pour la gestion d\'événements professionnels : création et publication d\'événements, inscription des participants, génération et distribution de billets, gestion de la capacité et check-in. L\'objectif est d\'offrir une expérience fluide et intuitive pour les organisateurs et les participants.')

report.add_heading('2. Conception et développement', level=1)
report.add_paragraph('Le développement a été guidé par les besoins suivants : simplicité pour l\'utilisateur, fiabilité des billets (PDF + QR), et capacité à gérer des événements gratuits et payants. Le travail a suivi des étapes claires : définition des besoins, conception de l\'expérience utilisateur, implémentation des écrans principaux, puis mise en place des fonctions de génération et d\'envoi des billets.')
report.add_paragraph('Les choix ont privilégié l\'ergonomie et la robustesse : interface claire pour la recherche d\'événements, formulaires d\'inscription simples et retours immédiats vers l\'utilisateur.')

report.add_heading('3. Fonctionnement global', level=1)
report.add_paragraph('Consultation : l\'utilisateur parcourt la liste des événements, filtre ou recherche par titre ou lieu, puis consulte le détail d\'un événement.')
report.add_paragraph('Inscription gratuite : l\'utilisateur saisit son nom et son email, reçoit immédiatement un billet PDF avec QR code par email.')
report.add_paragraph('Inscription payante : l\'utilisateur choisit un mode de paiement, effectue la transaction et, après confirmation, reçoit le billet par email.')
report.add_paragraph('Gestion des places : lorsque la capacité est atteinte, une liste d\'attente est proposée. Les participants sont notifiés automatiquement si une place se libère.')
report.add_paragraph('Check-in : à l\'entrée, le QR code est scanné et le participant est marqué comme présent.')

report.add_heading('4. Schéma global', level=1)
report.add_paragraph('Le schéma ci-dessous illustre les grandes étapes de la solution et les interactions entre l\'utilisateur, le frontend, le backend, la base de données, le service email et le fournisseur de paiement.')
report.add_picture(schema_path, width=Inches(6.5))
report.add_paragraph('Remarque : le schéma met en évidence le flux principal du Module 5, de la saisie d\'inscription à l\'envoi du billet et à la confirmation du paiement si nécessaire.')

report.add_heading('5. Emplacements réservés pour captures d\'écran', level=1)
report.add_paragraph('Capture 1 — Listing des événements : [EMPLACEMENT POUR CAPTURE 1]')
report.add_paragraph('Capture 2 — Détail d\'un événement gratuit : [EMPLACEMENT POUR CAPTURE 2]')
report.add_paragraph('Capture 3 — Détail d\'un événement payant : [EMPLACEMENT POUR CAPTURE 3]')
report.add_paragraph('Capture 4 — Confirmation et ticket généré : [EMPLACEMENT POUR CAPTURE 4]')

report.add_heading('6. Parcours utilisateur', level=1)
report.add_paragraph('Visiteur → consulte la liste → ouvre un événement → s\'inscrit (gratuit ou payant) → reçoit le billet par email.')
report.add_paragraph('Organisateur → crée un événement → définit la capacité et le type (gratuit / payant) → suit les inscriptions et le check-in.')

report.add_heading('7. Résultats et validations', level=1)
report.add_paragraph('Le Module 5 a été testé avec des scénarios réels : création d\'événements, inscriptions multiples, génération de billets et envoi d\'emails de confirmation. Les tests ont validé la génération correcte des billets et la stabilité du processus d\'inscription.')

report.add_heading('8. Recommandations', level=1)
report.add_paragraph('• Ajouter des statistiques d\'événement (taux de participation, taux de présence).')
report.add_paragraph('• Permettre l\'export des listes de participants pour les organisateurs.')
report.add_paragraph('• Prévoir des pages d\'administration supplémentaires (gestion manuelle des waitlists, annulations).')

output_path = 'reports/MODULE5_REPORT_FOR_WORD.docx'
report.save(output_path)
print(f'Generated DOCX at {output_path}')
print(f'Generated schema PNG at {schema_path}')
