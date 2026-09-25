from typing import Dict

def get_demo_confidence_metrics(element_type: str = "BOTTLENECK") -> Dict[str, float]:
    """
    Returns deterministic Phase 1 confidence scores.
    As per specification Section 11, these are benchmark demo scores, not AI-generated.
    """
    mapping = {
        "BOTTLENECK": {
            "detection_confidence": 0.95,
            "measurement_confidence": 0.90,
            "rule_applicability": 0.85,
            "evidence_quality": 0.88,
        },
        "DEAD_END": {
            "detection_confidence": 0.92,
            "measurement_confidence": 0.87,
            "rule_applicability": 0.91,
            "evidence_quality": 0.84,
        },
        "ACCESSIBILITY_COMPLIANCE": {
            "detection_confidence": 0.98,
            "measurement_confidence": 0.95,
            "rule_applicability": 0.92,
            "evidence_quality": 0.94,
        },
        "EGRESS_REDUNDANCY": {
            "detection_confidence": 0.92,
            "measurement_confidence": 0.88,
            "rule_applicability": 0.90,
            "evidence_quality": 0.85,
        }
    }
    return mapping.get(element_type, {
        "detection_confidence": 0.94,
        "measurement_confidence": 0.89,
        "rule_applicability": 0.86,
        "evidence_quality": 0.87,
    })
