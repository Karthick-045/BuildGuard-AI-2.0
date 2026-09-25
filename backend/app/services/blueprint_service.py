from sqlalchemy.orm import Session
from app.models.building_element import BuildingElement
from app.schemas.building import BuildingSummaryResponse, BuildingElementResponse

class BlueprintService:
    @staticmethod
    def generate_demo_elements(project_id: int, db: Session) -> BuildingSummaryResponse:
        """
        Creates deterministic demo building data for Phase 1 as required by Section 6 & Section 2.7:
        8 Rooms, 12 Doors, 4 Corridors, 2 Stairs, 2 Exits, 1 Ramp.
        Total = 29 elements.
        """
        # Clear existing elements for this project if any
        db.query(BuildingElement).filter(BuildingElement.project_id == project_id).delete()

        demo_elements_def = [
            # 8 Rooms
            ("ROOM", "Room A", 40, 40, 180, 140, 0.98),
            ("ROOM", "Room B", 40, 200, 180, 140, 0.97),
            ("ROOM", "Room C", 40, 360, 180, 140, 0.96),
            ("ROOM", "Room D", 620, 40, 180, 140, 0.97),
            ("ROOM", "Room E", 620, 200, 180, 140, 0.95),
            ("ROOM", "Room F", 620, 360, 180, 140, 0.94),
            ("ROOM", "Room G", 280, 420, 140, 100, 0.96),
            ("ROOM", "Room H", 440, 420, 140, 100, 0.95),

            # 12 Doors
            ("DOOR", "Door A", 220, 100, 20, 40, 0.96),
            ("DOOR", "Door B", 220, 260, 20, 40, 0.95),
            ("DOOR", "Door C", 220, 420, 20, 40, 0.94),
            ("DOOR", "Door D", 600, 100, 20, 40, 0.96),
            ("DOOR", "Door E", 600, 260, 20, 40, 0.95),
            ("DOOR", "Door F", 600, 420, 20, 40, 0.93),
            ("DOOR", "Door G", 340, 400, 30, 20, 0.92),
            ("DOOR", "Door H", 500, 400, 30, 20, 0.94),
            ("DOOR", "Door Exit A", 820, 260, 30, 50, 0.99),
            ("DOOR", "Door Exit B", 120, 520, 50, 30, 0.99),
            ("DOOR", "Fire Door 1", 360, 180, 30, 20, 0.93),
            ("DOOR", "Fire Door 2", 480, 180, 30, 20, 0.91),

            # 4 Corridors
            ("CORRIDOR", "Corridor C", 240, 80, 80, 320, 0.97),
            ("CORRIDOR", "Corridor West", 520, 80, 80, 320, 0.96),
            ("CORRIDOR", "Corridor East", 340, 340, 160, 60, 0.94),
            ("CORRIDOR", "Main Hallway", 340, 120, 160, 60, 0.95),

            # 2 Stairs
            ("STAIR", "Stair 1", 200, 440, 60, 80, 0.95),
            ("STAIR", "Stair 2", 520, 40, 80, 60, 0.93),

            # 1 Ramp
            ("RAMP", "Ramp 1", 360, 420, 60, 60, 0.98),

            # 2 Exits
            ("EXIT", "Exit A", 850, 250, 60, 70, 0.99),
            ("EXIT", "Exit B", 80, 520, 70, 50, 0.99),
        ]

        created_objs = []
        for elem_type, label, x, y, w, h, conf in demo_elements_def:
            obj = BuildingElement(
                project_id=project_id,
                element_type=elem_type,
                label=label,
                x=x,
                y=y,
                width=w,
                height=h,
                confidence=conf
            )
            db.add(obj)
            created_objs.append(obj)

        db.commit()

        # Query and return formatted summary
        elements = db.query(BuildingElement).filter(BuildingElement.project_id == project_id).all()
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
