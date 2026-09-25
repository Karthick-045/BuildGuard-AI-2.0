from sqlalchemy.orm import Session
from typing import Dict, Any
from app.models.project import Project
from app.models.finding import Finding
from app.models.building_element import BuildingElement

class ReportService:
    @staticmethod
    def generate_project_report(project_id: int, db: Session) -> Dict[str, Any]:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return {"error": "Project not found"}

        findings = db.query(Finding).filter(Finding.project_id == project_id).all()
        elements = db.query(BuildingElement).filter(BuildingElement.project_id == project_id).all()

        critical_count = sum(1 for f in findings if f.severity == "CRITICAL")
        high_count = sum(1 for f in findings if f.severity == "HIGH")

        return {
            "project_name": project.name,
            "building_type": project.building_type,
            "floors": project.floors,
            "total_elements": len(elements),
            "total_findings": len(findings),
            "critical_findings": critical_count,
            "high_findings": high_count,
            "compliance_status": "REQUIRES_REVIEW" if (critical_count + high_count > 0) else "COMPLIANT"
        }

report_service = ReportService()
