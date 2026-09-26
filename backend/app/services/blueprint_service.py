from sqlalchemy.orm import Session
from app.models.building_element import BuildingElement
from app.models.ai_models import YOLOVisionModel, OCRPerceptionModel
from app.schemas.building import BuildingSummaryResponse, BuildingElementResponse

class BlueprintService:
    @staticmethod
    def generate_demo_elements(project_id: int, db: Session, blueprint_path: str = None) -> BuildingSummaryResponse:
        """
        Creates building element data extracted by YOLOVisionModel and OCRPerceptionModel:
        8 Rooms, 12 Doors, 4 Corridors, 2 Stairs, 2 Exits, 1 Ramp.
        Total = 29 elements with bounding boxes and detection confidence.
        """
        # If project already has elements (e.g. created by voice input), preserve them
        existing_elements = db.query(BuildingElement).filter(BuildingElement.project_id == project_id).all()
        if existing_elements and len(existing_elements) > 0:
            return BlueprintService.get_summary(project_id, db)

        # Clear existing elements for this project if any
        db.query(BuildingElement).filter(BuildingElement.project_id == project_id).delete()

        # Run YOLO Vision Detection
        detections = YOLOVisionModel.detect_blueprint_elements(blueprint_path)

        created_objs = []
        for det in detections:
            bbox = det["bbox"]
            obj = BuildingElement(
                project_id=project_id,
                element_type=det["type"],
                label=det["label"],
                x=bbox[0],
                y=bbox[1],
                width=bbox[2],
                height=bbox[3],
                confidence=det["confidence"],
                source="BLUEPRINT",
                detected_class=det.get("class_name", det["type"].lower()),
                bounding_box={"x": bbox[0], "y": bbox[1], "width": bbox[2], "height": bbox[3]},
                attributes={
                    "width_mm": det.get("width_mm"),
                    "clear_width_mm": det.get("clear_width_mm"),
                    "slope": det.get("slope")
                }
            )
            db.add(obj)
            created_objs.append(obj)

        db.commit()

        # Query and return formatted summary
        return BlueprintService.get_summary(project_id, db)

    @staticmethod
    def get_summary(project_id: int, db: Session) -> BuildingSummaryResponse:
        elements = db.query(BuildingElement).filter(BuildingElement.project_id == project_id).all()
        
        counts = {
            "ROOM": 0,
            "DOOR": 0,
            "CORRIDOR": 0,
            "STAIR": 0,
            "RAMP": 0,
            "EXIT": 0
        }

        for el in elements:
            if el.element_type in counts:
                counts[el.element_type] += 1

        element_responses = [BuildingElementResponse.model_validate(el) for el in elements]

        return BuildingSummaryResponse(
            rooms=counts["ROOM"],
            doors=counts["DOOR"],
            corridors=counts["CORRIDOR"],
            stairs=counts["STAIR"],
            exits=counts["EXIT"],
            ramps=counts["RAMP"],
            total_elements=len(elements),
            elements=element_responses
        )

blueprint_service = BlueprintService()
