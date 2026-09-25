from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.models.finding import Finding
from app.core.safety_graph import safety_graph_engine
from app.models.ai_models import RuleEngineCheckModel, BuildingContextModel
from app.schemas.finding import FindingResponse

class BottleneckService:
    @staticmethod
    def analyze_and_record_findings(project_id: int, db: Session, building_type: str = "Commercial") -> List[FindingResponse]:
        """
        Uses NetworkX safety graph and RuleEngineCheckModel to evaluate
        the 8 comprehensive egress & architectural safety checks.
        Stores explainable AI findings in MySQL/SQLite.
        """
        # Clear existing findings for this project
        db.query(Finding).filter(Finding.project_id == project_id).delete()

        G = safety_graph_engine.build_demo_graph()
        building_context = BuildingContextModel.get_building_context(building_type)
        rule_findings = RuleEngineCheckModel.run_8_checks(G, building_context)

        created_findings = []
        for f_data in rule_findings:
            finding = Finding(
                project_id=project_id,
                rule_id=f_data.get("rule_id"),
                element=f_data["element"],
                finding_type=f_data["finding_type"],
                severity=f_data["severity"],
                status=f_data.get("status", "REQUIRES_REVIEW"),
                description=f_data["description"],
                ai_explanation=f_data.get("ai_explanation"),
                remediation=f_data.get("remediation"),
                affected_elements=f_data.get("affected_elements", []),
                detection_confidence=f_data.get("detection_confidence", 0.95),
                measurement_confidence=f_data.get("measurement_confidence", 0.90),
                rule_applicability=f_data.get("rule_applicability", 0.85),
                evidence_quality=f_data.get("evidence_quality", 0.88),
            )
            db.add(finding)
            created_findings.append(finding)

        db.commit()

        # Query all findings for project
        all_findings = db.query(Finding).filter(Finding.project_id == project_id).order_by(Finding.id.asc()).all()
        return [FindingResponse.model_validate(f) for f in all_findings]

    @staticmethod
    def get_findings_for_project(project_id: int, db: Session) -> List[FindingResponse]:
        all_findings = db.query(Finding).filter(Finding.project_id == project_id).order_by(Finding.id.asc()).all()
        return [FindingResponse.model_validate(f) for f in all_findings]

bottleneck_service = BottleneckService()
