from sqlalchemy.orm import Session
from typing import List
from app.models.finding import Finding
from app.core.safety_graph import safety_graph_engine
from app.core.rule_engine import rule_engine
from app.schemas.finding import FindingResponse

class BottleneckService:
    @staticmethod
    def analyze_and_record_findings(project_id: int, db: Session) -> List[FindingResponse]:
        """
        Uses NetworkX articulation points and safety rules to generate
        deterministic Phase 1 findings and stores them in MySQL.
        """
        # Clear existing findings for this project
        db.query(Finding).filter(Finding.project_id == project_id).delete()

        G = safety_graph_engine.build_demo_graph()
        rule_findings = rule_engine.evaluate_safety_rules(G)

        created_findings = []
        for f_data in rule_findings:
            finding = Finding(
                project_id=project_id,
                element=f_data["element"],
                finding_type=f_data["finding_type"],
                severity=f_data["severity"],
                status=f_data.get("status", "REQUIRES_REVIEW"),
                description=f_data["description"],
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
