from typing import Dict, Any, Optional
from app.models.ai_models import EvidenceQualityModel

class EvidenceValidator:
    """
    Core validator for architectural inspection evidence.
    Validates uploaded blueprints and site photos to ensure they meet
    minimum optical standards for forensic building safety analysis.
    """

    @staticmethod
    def validate_asset(file_path: str) -> Dict[str, Any]:
        return EvidenceQualityModel.analyze_image(file_path)

    @staticmethod
    def compute_trust_metrics(
        detection_confidence: float = 0.95,
        measurement_confidence: float = 0.90,
        rule_applicability: float = 0.85,
        evidence_quality: float = 0.88
    ) -> Dict[str, Any]:
        """
        Maintains 4 distinct trust numbers per Slide 7:
        Never blends them into a single arbitrary score.
        """
        # Determine overall safety status
        min_signal = min(detection_confidence, measurement_confidence, rule_applicability, evidence_quality)
        if min_signal < 0.70:
            status = "FAIL"
        elif min_signal < 0.85:
            status = "REQUIRES_REVIEW"
        elif min_signal < 0.90:
            status = "WARNING"
        else:
            status = "PASS"

        return {
            "detection_confidence": detection_confidence,
            "measurement_confidence": measurement_confidence,
            "rule_applicability": rule_applicability,
            "evidence_quality": evidence_quality,
            "status": status
        }

evidence_validator = EvidenceValidator()
