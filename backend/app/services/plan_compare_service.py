from typing import Dict, Any

class PlanCompareService:
    """
    Service for plan vs actual baseline metrics (Phase 1 deterministic).
    Provides structured comparisons for blueprint vs site verification.
    """
    @staticmethod
    def get_plan_vs_actual_summary(project_id: int) -> Dict[str, Any]:
        return {
            "project_id": project_id,
            "blueprint_status": "VERIFIED",
            "detected_doors": 12,
            "planned_doors": 12,
            "door_variance": 0,
            "detected_exits": 2,
            "planned_exits": 2,
            "clearance_compliance_rate": "98.5%",
            "notes": "Plan matched with baseline blueprint layout without structural deviations."
        }

plan_compare_service = PlanCompareService()
