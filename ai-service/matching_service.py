"""
Secteur-based matching service
Recommends connections based on industry/sector
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import math

app = FastAPI()

# Industry sectors
SECTORS = [
    "Technology",
    "Finance",
    "Healthcare",
    "Education",
    "Marketing",
    "Entrepreneurship",
    "Real Estate",
    "Logistics",
    "Manufacturing",
    "Agriculture",
    "Energy",
    "Consulting",
    "Retail",
    "Hospitality",
    "Construction",
    "Media",
    "E-Commerce",
    "Fintech",
    "SaaS",
    "Startup"
]

FUTURE_CAPABILITIES = [
    {
        "id": "agentic-ai",
        "name": "Agentic AI Copilot",
        "horizon": "2026",
        "value": "Assistant autonome pour suggerer les prochaines actions profil, networking et matching.",
        "status": "demo-ready",
    },
    {
        "id": "trustworthy-ai",
        "name": "AI governance and risk controls",
        "horizon": "2026+",
        "value": "Score de confiance, journal d'audit, transparence et recommandations responsables.",
        "status": "demo-ready",
    },
    {
        "id": "verifiable-credentials",
        "name": "Verifiable Credentials 2.0",
        "horizon": "2026+",
        "value": "Preparation a des diplomes, certifications et identites professionnelles verifiables.",
        "status": "roadmap",
    },
    {
        "id": "passkeys",
        "name": "Passkeys and passwordless identity",
        "horizon": "2026+",
        "value": "Connexion sans mot de passe, meilleure experience et reduction du risque de phishing.",
        "status": "roadmap",
    },
    {
        "id": "semantic-profile",
        "name": "Semantic profile intelligence",
        "horizon": "2026",
        "value": "Analyse des competences, secteurs, interets et signaux de matching.",
        "status": "demo-ready",
    },
    {
        "id": "privacy-consent",
        "name": "Privacy and consent automation",
        "horizon": "2026+",
        "value": "Controle champ par champ, consentement explicite et export/suppression des donnees.",
        "status": "demo-ready",
    },
    {
        "id": "quantum-ready-security",
        "name": "Quantum-ready security planning",
        "horizon": "future",
        "value": "Preparation gouvernance securite pour les evolutions cryptographiques a venir.",
        "status": "roadmap",
    },
    {
        "id": "digital-twin-member",
        "name": "Member digital twin",
        "horizon": "future",
        "value": "Representation dynamique du membre pour opportunites, mentorat et recommandations.",
        "status": "concept",
    },
]

@app.get("/")
async def root() -> dict:
    """
    Human-friendly entry point for browser testing.
    """
    return {
        "status": "ok",
        "service": "communium-ai-service",
        "message": "AI matching service is running",
        "health": "/health",
        "docs": "/docs",
        "test_demo": "/api/matching/demo",
        "endpoints": {
            "sectors": {
                "methods": ["GET", "POST"],
                "path": "/api/matching/sectors-available"
            },
            "matching": {
                "method": "POST",
                "path": "/api/matching/sector-based"
            },
            "score": {
                "method": "POST",
                "path": "/api/matching/calculate-score"
            },
            "future_intelligence": {
                "methods": ["GET", "POST"],
                "paths": [
                    "/api/intelligence/capabilities",
                    "/api/intelligence/profile-audit",
                    "/api/intelligence/smart-summary"
                ]
            }
        }
    }

class UserProfile(BaseModel):
    id: int
    name: str
    email: str
    sector: str
    sub_sectors: List[str]
    years_experience: int
    location: str  # City or region (Maroc = Morocco)
    interests: List[str]

class MatchSuggestion(BaseModel):
    user_id: int
    name: str
    sector: str
    match_score: float
    common_sectors: List[str]
    reason: str
    distance_km: Optional[float] = None

class IntelligenceProfile(BaseModel):
    profile: Dict[str, Any] = {}
    privacy: Dict[str, Any] = {}
    experiences: List[Dict[str, Any]] = []
    interests: List[Dict[str, Any]] = []

def _present(value: Any) -> bool:
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, list):
        return len(value) > 0
    return value is not None and value is not False

def audit_profile_payload(payload: IntelligenceProfile) -> dict:
    profile = payload.profile or {}
    privacy = payload.privacy or {}
    experiences = payload.experiences or []
    interests = payload.interests or []

    checks = [
        ("identity", _present(profile.get("firstName")) and _present(profile.get("lastName"))),
        ("contact", _present(profile.get("email")) and _present(profile.get("phone"))),
        ("location", _present(profile.get("country")) and _present(profile.get("city"))),
        ("current_role", _present(profile.get("currentJobTitle")) or _present(profile.get("currentCompany"))),
        ("public_url", _present(profile.get("publicProfileUrl"))),
        ("photo", _present(profile.get("profilePictureUrl"))),
        ("cv", _present(profile.get("cvUrl"))),
        ("identity_document", _present(profile.get("identityDocumentNumber")) or _present(profile.get("identityDocumentUrl"))),
        ("professional_history", len(experiences) > 0),
        ("interests", len(interests) > 0),
        ("privacy", _present(privacy.get("profileVisibility"))),
    ]

    completed = [name for name, ok in checks if ok]
    missing = [name for name, ok in checks if not ok]
    score = round((len(completed) / len(checks)) * 100, 1)
    risk_level = "low" if score >= 80 else "medium" if score >= 55 else "high"

    recommendations = []
    if "identity_document" in missing:
        recommendations.append("Ajouter CIN/Passeport ou document d'identite pour renforcer la confiance.")
    if "professional_history" in missing:
        recommendations.append("Ajouter au moins une experience pour ameliorer le matching.")
    if "interests" in missing:
        recommendations.append("Ajouter des tags d'interet pour activer le matching semantique.")
    if privacy.get("profileVisibility") == "Public" and privacy.get("showCV"):
        recommendations.append("Verifier que le CV public ne contient pas d'informations sensibles.")
    if not recommendations:
        recommendations.append("Profil pret pour une demo enterprise et publication publique.")

    return {
        "score": score,
        "risk_level": risk_level,
        "completed": completed,
        "missing": missing,
        "recommendations": recommendations,
        "agentic_next_actions": [
            "Verifier URL publique",
            "Publier le profil public",
            "Lancer la recherche de profils compatibles",
            "Exporter une preuve JSON du profil",
        ],
        "governance": {
            "transparency": "heuristic-demo",
            "human_review_required": risk_level != "low",
            "privacy_by_design": True,
            "audit_ready": True,
        },
    }

def calculate_sector_match(user1_sectors: List[str], user2_sectors: List[str]) -> tuple[float, List[str]]:
    """
    Calculate match score based on shared sectors
    Returns: (score: 0-100, common_sectors: list)
    """
    if not user1_sectors or not user2_sectors:
        return 0.0, []
    
    common = set(user1_sectors) & set(user2_sectors)
    score = (len(common) / len(set(user1_sectors) | set(user2_sectors))) * 100
    return score, list(common)

def calculate_experience_compatibility(exp1: int, exp2: int) -> float:
    """
    Calculates compatibility bonus based on experience levels
    Mentors (higher exp) pair well with learners (lower exp)
    """
    diff = abs(exp1 - exp2)
    
    if diff == 0:
        return 10  # Same level = peer learning
    elif diff <= 5:
        return 15  # Good learning opportunity
    elif diff <= 10:
        return 20  # Great mentor/mentee match
    else:
        return 25  # Excellent mentor/mentee match (but maybe too different)

def calculate_distance_bonus(location1: str, location2: str) -> float:
    """
    Bonus for being in same city/region (Maroc-specific)
    """
    if location1.lower() == location2.lower():
        return 15  # Same city
    
    # Moroccan regions
    moroccan_regions = {
        "Casablanca": "Grand Casablanca",
        "Fes": "Fes-Meknes",
        "Marrakech": "Marrakech-Safi",
        "Tangier": "Tangier-Tetouan",
        "Rabat": "Rabat-Sale-Kenitra",
    }
    
    region1 = moroccan_regions.get(location1, location1)
    region2 = moroccan_regions.get(location2, location2)
    
    if region1 == region2:
        return 10  # Same region
    
    return 0  # Different region

@app.post("/api/matching/sector-based")
async def sector_based_matching(
    user: UserProfile,
    candidates: List[UserProfile],
    limit: int = 10
) -> List[MatchSuggestion]:
    """
    Find best matches based on industry sector and experience
    """
    matches = []
    
    for candidate in candidates:
        if candidate.id == user.id:
            continue
        
        # Calculate sector match
        sector_score, common_sectors = calculate_sector_match(
            [user.sector] + user.sub_sectors,
            [candidate.sector] + candidate.sub_sectors
        )
        
        # Calculate experience bonus
        exp_bonus = calculate_experience_compatibility(
            user.years_experience,
            candidate.years_experience
        )
        
        # Calculate location bonus (Maroc)
        location_bonus = calculate_distance_bonus(user.location, candidate.location)
        
        # Final score
        total_score = min(100, sector_score + (exp_bonus * 0.5) + location_bonus)
        
        if total_score > 30:  # Minimum threshold
            # Generate reason for match
            reason = f"Shared interest in {', '.join(common_sectors[:2])}"
            if user.years_experience > candidate.years_experience:
                reason += " - You could be a mentor"
            elif user.years_experience < candidate.years_experience:
                reason += " - Great learning opportunity"
            
            matches.append(MatchSuggestion(
                user_id=candidate.id,
                name=candidate.name,
                sector=candidate.sector,
                match_score=round(total_score, 1),
                common_sectors=common_sectors,
                reason=reason,
                distance_km=0  # Could be enhanced with real geolocation
            ))
    
    # Sort by score descending
    matches.sort(key=lambda x: x.match_score, reverse=True)
    
    return matches[:limit]

@app.get("/api/matching/demo")
async def demo_matching() -> dict:
    """
    Browser-friendly demo endpoint.
    """
    user = UserProfile(
        id=1,
        name="Vous",
        email="member@communium.local",
        sector="Technology",
        sub_sectors=["SaaS", "AI"],
        years_experience=5,
        location="Casablanca",
        interests=["innovation", "startups"]
    )
    candidates = [
        UserProfile(
            id=2,
            name="Amal Bennani",
            email="amal@example.com",
            sector="Technology",
            sub_sectors=["AI", "Fintech"],
            years_experience=9,
            location="Casablanca",
            interests=["investment", "mentoring"]
        ),
        UserProfile(
            id=3,
            name="Youssef El Idrissi",
            email="youssef@example.com",
            sector="Finance",
            sub_sectors=["Fintech", "SaaS"],
            years_experience=12,
            location="Rabat",
            interests=["growth", "networking"]
        )
    ]

    matches = await sector_based_matching(user=user, candidates=candidates, limit=10)
    return {
        "success": True,
        "user": user,
        "matches": matches
    }

@app.api_route("/api/matching/sectors-available", methods=["GET", "POST"])
async def get_available_sectors() -> dict:
    """
    Get list of available industry sectors for filtering
    """
    return {
        "sectors": SECTORS,
        "count": len(SECTORS)
    }

@app.post("/api/matching/calculate-score")
async def calculate_match_score(
    user1: UserProfile,
    user2: UserProfile
) -> dict:
    """
    Calculate detailed match score between two users
    """
    sector_score, common = calculate_sector_match(
        [user1.sector] + user1.sub_sectors,
        [user2.sector] + user2.sub_sectors
    )
    
    exp_bonus = calculate_experience_compatibility(
        user1.years_experience,
        user2.years_experience
    )
    
    location_bonus = calculate_distance_bonus(user1.location, user2.location)
    
    total_score = min(100, sector_score + (exp_bonus * 0.5) + location_bonus)
    
    return {
        "total_score": round(total_score, 1),
        "sector_score": round(sector_score, 1),
        "experience_bonus": round(exp_bonus, 1),
        "location_bonus": round(location_bonus, 1),
        "common_sectors": common,
        "breakdown": {
            "sector_match": f"{round(sector_score)}%",
            "experience_compatibility": "Mentor/Mentee" if abs(user1.years_experience - user2.years_experience) > 5 else "Peer Learning",
            "location": "Same City" if user1.location == user2.location else "Different Region"
        }
    }

@app.get("/api/intelligence/capabilities")
async def intelligence_capabilities() -> dict:
    """
    2026+ intelligence capability catalog for the frontend demo.
    """
    return {
        "success": True,
        "year_focus": "2026+",
        "capabilities": FUTURE_CAPABILITIES,
        "principles": [
            "Human-in-the-loop",
            "Privacy by design",
            "Explainable recommendations",
            "Digital trust",
            "Interoperable identity",
            "Auditability",
        ],
    }

@app.post("/api/intelligence/profile-audit")
async def profile_audit(payload: IntelligenceProfile) -> dict:
    """
    Deterministic AI-style audit for demo without external LLM dependency.
    """
    return {
        "success": True,
        "model": "communium-profile-intelligence-demo",
        "audit": audit_profile_payload(payload),
    }

@app.get("/api/intelligence/profile-audit/demo")
async def profile_audit_demo() -> dict:
    demo_payload = IntelligenceProfile(
        profile={
            "firstName": "Sara",
            "lastName": "Bennani",
            "email": "sara@example.com",
            "phone": "0600000000",
            "country": "Maroc",
            "city": "Casablanca",
            "currentJobTitle": "Product Manager",
            "currentCompany": "Communium",
            "publicProfileUrl": "sara-bennani-demo",
            "cvUrl": "/uploads/cvs/demo.pdf",
        },
        privacy={"profileVisibility": "Public", "showCV": False},
        experiences=[{"jobTitle": "Product Manager", "company": "Communium"}],
        interests=[{"name": "Technology"}, {"name": "AI"}],
    )
    return await profile_audit(demo_payload)

@app.post("/api/intelligence/smart-summary")
async def smart_summary(payload: IntelligenceProfile) -> dict:
    profile = payload.profile or {}
    name = " ".join([
        str(profile.get("firstName") or "").strip(),
        str(profile.get("lastName") or "").strip(),
    ]).strip() or "Ce membre"
    role = profile.get("currentJobTitle") or "professionnel"
    company = profile.get("currentCompany")
    city = profile.get("city")
    interests = [item.get("name") for item in (payload.interests or []) if item.get("name")]
    interest_text = ", ".join(interests[:4]) if interests else "ses centres d'interet"
    location_text = f" a {city}" if city else ""
    company_text = f" chez {company}" if company else ""

    return {
        "success": True,
        "summary": f"{name} est {role}{company_text}{location_text}, avec un profil oriente {interest_text}.",
        "headline": f"{role}{company_text}",
        "suggested_public_bio": (
            f"{name} combine experience professionnelle, centres d'interet et presence reseau "
            "pour faciliter des connexions qualifiees sur Communium."
        ),
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "matching-service"}
