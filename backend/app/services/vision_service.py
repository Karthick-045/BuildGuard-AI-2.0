from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.asset import Asset
from app.models.building_element import BuildingElement
from app.models.ai_models import YOLOVisionModel, EvidenceQualityModel

class VisionService:
    """
    Computer Vision Service for site inspection photos and blueprint spatial analysis.
    Uses YOLOVisionModel to detect physical features, clearances, and obstacles.
    """

    @staticmethod
    def inspect_site_photos(project_id: int, db: Session) -> Dict[str, Any]:
        """
        Analyzes all site photos uploaded for a project, performs YOLO/CV object detection,
        and evaluates evidence quality.
        """
        photos = db.query(Asset).filter(
            Asset.project_id == project_id,
            Asset.asset_type == "SITE_PHOTO"
        ).all()

        photo_results = []
        all_detections = []
        overall_quality_scores = []

        for p in photos:
            # 1. Run evidence quality check
            quality = EvidenceQualityModel.analyze_image(p.file_path)
            p.resolution_width = quality.get("resolution_width")
            p.resolution_height = quality.get("resolution_height")
            p.brightness = quality.get("brightness")
            p.contrast = quality.get("contrast")
            p.sharpness = quality.get("sharpness")
            p.quality_status = quality.get("quality_status")
            p.quality_score = quality.get("quality_score")
            p.quality_details = quality.get("details")

            overall_quality_scores.append(quality.get("quality_score", 0.88))

            # 2. Run CV object detection
            detections = YOLOVisionModel.detect_site_photo_objects(p.file_path)
            all_detections.extend(detections)

            photo_results.append({
                "asset_id": p.id,
                "file_name": p.file_name,
                "evidence_quality": quality,
                "detections": detections
            })

        db.commit()

        avg_quality = (sum(overall_quality_scores) / len(overall_quality_scores)) if overall_quality_scores else 0.88

        return {
            "total_photos": len(photos),
            "average_evidence_quality": round(avg_quality, 2),
            "quality_status": "PASS" if avg_quality >= 0.80 else "REVIEW",
            "photos_analyzed": photo_results,
            "detected_features": all_detections
        }

vision_service = VisionService()
